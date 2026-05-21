import type { NextConfig } from "next";

// GitHub Pages serves the repo at https://<user>.github.io/<repo>/
// We bake that prefix into the build only when explicitly building for Pages.
const isGhPages = process.env.GH_PAGES === "true";
const repoBase = "/simply-live";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGhPages ? repoBase : undefined,
  assetPrefix: isGhPages ? `${repoBase}/` : undefined,
  trailingSlash: true,
};

export default nextConfig;
