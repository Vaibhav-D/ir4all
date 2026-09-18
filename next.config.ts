import type { NextConfig } from "next";

// GitHub Pages: a static export under /<repo>/ (see .github/workflows/pages.yml).
// Locally nothing changes; `npm run dev` and `next build` behave as before.
const pages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(pages && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
