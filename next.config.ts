import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "pdfkit", "pptxgenjs"],
  poweredByHeader: false,
  devIndicators: false,
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};

export default config;
