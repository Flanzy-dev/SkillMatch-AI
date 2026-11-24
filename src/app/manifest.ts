import type { MetadataRoute } from "next";
import id from "../../messages/id.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: id.Meta.title,
    short_name: id.Common.brand,
    description: id.Meta.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
