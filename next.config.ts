import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Member portal — kept minimal for now. Remote event/profile images are served
     by dsec-api (Supabase Storage) and rendered as plain <img>, so no next/image
     remotePatterns config is needed yet. Add it here when we adopt next/image
     for those. */
};

export default nextConfig;
