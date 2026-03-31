const nextConfig = {
  output: "export",

  images: {
    unoptimized: true, // 🔥 IMPORTANT
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;