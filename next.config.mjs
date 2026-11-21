/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet 4 initialise une carte deux fois avec le double montage
  // de Strict Mode, ce qui déclenche « Map container is already initialized ».
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
