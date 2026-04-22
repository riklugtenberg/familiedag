import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Dev over LAN: add the IP you open in the browser (hotspot vs home WiFi differ).
  allowedDevOrigins: ['192.168.137.1', '192.168.2.11'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
