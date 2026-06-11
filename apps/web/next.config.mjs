/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Bake the production API URL into the build */
  env: {
    NEXT_PUBLIC_API_URL: 'https://balochi-bazar-backend.vercel.app',
  },
  /* Allows referencing external image URLs in CSS or raw tags easily */
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
