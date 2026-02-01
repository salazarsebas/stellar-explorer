import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://stellar-explorer.acachete.xyz";

  return [
    { url: baseUrl, priority: 1.0, changeFrequency: "hourly" },
    { url: `${baseUrl}/transactions`, priority: 0.9, changeFrequency: "always" },
    { url: `${baseUrl}/ledgers`, priority: 0.9, changeFrequency: "always" },
    { url: `${baseUrl}/accounts`, priority: 0.8, changeFrequency: "daily" },
    { url: `${baseUrl}/assets`, priority: 0.8, changeFrequency: "daily" },
    { url: `${baseUrl}/contracts`, priority: 0.8, changeFrequency: "daily" },
  ];
}
