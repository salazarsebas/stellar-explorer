import { NextRequest, NextResponse } from "next/server";
import { parse } from "smol-toml";
import type { StellarTomlData, AssetMetadata } from "@/types/toml";

// Simple in-memory rate limiting (per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tomlUrl = searchParams.get("url");
  const code = searchParams.get("code");
  const issuer = searchParams.get("issuer");

  // Validate required parameters
  if (!tomlUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  if (!code || !issuer) {
    return NextResponse.json({ error: "Missing 'code' or 'issuer' parameter" }, { status: 400 });
  }

  // Rate limit check
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // SSRF protection: validate URL
  try {
    const parsedUrl = new URL(tomlUrl);
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTPS URLs are allowed" }, { status: 400 });
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
    if (
      blockedHosts.includes(hostname) ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("169.254.")
    ) {
      return NextResponse.json({ error: "Internal URLs are not allowed" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Fetch the stellar.toml file
    const response = await fetch(tomlUrl, {
      headers: {
        Accept: "text/plain, application/toml",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch TOML: ${response.status}` },
        { status: response.status }
      );
    }

    const tomlText = await response.text();

    // Parse TOML
    const tomlData = parse(tomlText) as StellarTomlData;

    // Find the matching currency
    const currency = tomlData.CURRENCIES?.find(
      (c) => c.code?.toUpperCase() === code.toUpperCase() && c.issuer === issuer
    );

    // Build the asset metadata response
    const metadata: AssetMetadata = {
      code,
      issuer,
      name: currency?.name,
      description: currency?.desc,
      imageUrl: currency?.image,
      orgName: tomlData.DOCUMENTATION?.ORG_NAME,
      orgLogo: tomlData.DOCUMENTATION?.ORG_LOGO,
    };

    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, max-age=86400", // 24 hours
      },
    });
  } catch {
    // Return empty metadata on error (allows graceful fallback)
    const metadata: AssetMetadata = {
      code,
      issuer,
    };

    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, max-age=3600", // 1 hour for errors
      },
    });
  }
}
