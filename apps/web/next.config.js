/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // The seeder serves every product shot from the Unsplash CDN at a 3:4 crop.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
