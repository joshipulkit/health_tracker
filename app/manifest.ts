import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Body Metrics Tracker",
    short_name: "BodyTracker",
    description: "Personal tracking app for weight, body fat, nutrition, sleep, and training.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f9f2",
    theme_color: "#5ea24c",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
