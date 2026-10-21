/** @type {import('next').NextConfig} */
const nextConfig = {
  // The treasurer pages moved under /dashboard. Old links still work.
  async redirects() {
    return [
      { source: "/pay", destination: "/dashboard/pay-bills", permanent: false },
      { source: "/envelope", destination: "/dashboard/record-gift", permanent: false },
    ];
  },
};

export default nextConfig;
