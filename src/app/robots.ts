import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/watchlist"],
      },
    ],
    sitemap: "https://stellar-explorer.acachete.xyz/sitemap.xml",
  };
}
