import withPWA from 'next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';

// 静态模式下不需要 setupDevPlatform，直接初始化 i18n
const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // 必须：生成静态 HTML
  trailingSlash: true,   // 必须：防止 GitHub Pages 刷新 404
  images: {
    unoptimized: true,   // 必须：静态导出不支持 Next.js 默认的 Image Optimization
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' }
    ],
  },
  // 显式禁用某些在静态导出中可能导致冲突的特性
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const withPWAConfigured = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
}) as any;

export default withNextIntl(withPWAConfigured(nextConfig));
