import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 国内部署友好：禁用图片优化（国内无需Vercel Edge）
  images: {
    unoptimized: true,
  },
  // 环境变量透传
  env: {
    APP_VERSION: '2.0.0',
  },
};

export default nextConfig;
