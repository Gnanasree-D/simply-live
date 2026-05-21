import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SimplyLive",
    short_name: "SimplyLive",
    description:
      "Journaling, habits, goals, and time — joined by a single thread.",
    start_url: "/today",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#1f1b16",
    icons: [
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
      {
        src: "/icon-maskable.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
