/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["ws", "node-telegram-bot-api"] },
};

module.exports = nextConfig;
