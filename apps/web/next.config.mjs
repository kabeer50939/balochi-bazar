/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Proxy all /api/* requests to the backend — eliminates CORS completely */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://balochi-bazar-backend.vercel.app/api/:path*',
      },
    ];
  },
  /* Bake the production API URL into the build */
  env: {
    NEXT_PUBLIC_API_URL: '',
  },
  /* Allows referencing external image URLs */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'balochi-bazar-backend.vercel.app',
      },
    ],
  },
};

export default nextConfig;
