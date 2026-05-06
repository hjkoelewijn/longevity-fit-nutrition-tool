import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Zorg dat Turbopack altijd vanuit deze app-map resolved (tailwindcss, postcss, etc.)
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
