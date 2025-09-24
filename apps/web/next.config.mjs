/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@nsm/db', '@nsm/core']
  }
}

export default nextConfig
