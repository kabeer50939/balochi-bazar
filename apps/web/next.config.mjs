/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Allows referencing external image URLs in CSS or raw tags easily */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
