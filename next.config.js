/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      serverExternalPackages: ['ssh2', 'cpu-features'],
    },
  },
}

module.exports = nextConfig
