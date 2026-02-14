import { NextRequest, NextResponse } from "next/server";
import { parse } from "smol-toml";
import type { StellarTomlData, AssetMetadata } from "@/types/toml";

// Cache for TOML responses (in-memory, per-instance)
const tomlCache = new Map<string, { data: StellarTomlData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
    // Check cache first
    const cacheKey = tomlUrl;
    const cached = tomlCache.get(cacheKey);
    const now = Date.now();

    let tomlData: StellarTomlData;

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      tomlData = cached.data;
    } else {
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
      tomlData = parse(tomlText) as StellarTomlData;

      // Cache the result
      tomlCache.set(cacheKey, { data: tomlData, timestamp: now });
    }

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
  } catch (error) {
    console.error("Error fetching/parsing TOML:", error);

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
