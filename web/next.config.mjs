/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  env: {
    APP_VERSION: '2.0.0',
  },
  webpack: (config) => {
    // 将 @vercel/blob 标记为 external，避免编译时解析
    // 仅在 STORAGE_MODE=vercel-blob 时运行时动态加载
    config.externals.push('@vercel/blob');
    return config;
  },
};

export default nextConfig;
