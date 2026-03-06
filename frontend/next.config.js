/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Improve cache handling
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // Disable static page optimization in dev if needed
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

module.exports = nextConfig;
