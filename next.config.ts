import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The commit this build came from, so an open app can tell when a newer one is live.
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
};

export default nextConfig;
