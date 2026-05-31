import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "letshangg",
    short_name: "letshangg",
    description: "Say yes to hangs you would actually do. Match when a friend says yes too.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#CFE7FB",
    theme_color: "#FFF8D6",
    orientation: "portrait",
    categories: ["social", "lifestyle"],
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
