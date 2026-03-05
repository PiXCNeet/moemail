import withPWA from 'next-pwa'
import createNextIntlPlugin from 'next-intl/plugin'
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// 开发环境 Cloudflare 平台设置
async function setup() {
  if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform()
  }
}
setup()

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静态导出
  trailingSlash: true, // 路径结尾加斜杠，防止 404
  images: {
    unoptimized: true, // 禁用服务器端图片优化
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' }
    ],
  },
  // 如果你需要部署到 GitHub Pages 的子目录（如 your-user.github.io/moemail/）
  // 请取消下面这行的注释并修改
  // basePath: '/moemail', 
};

const withPWAConfigured = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
}) as any

export default withNextIntl(withPWAConfigured(nextConfig))
