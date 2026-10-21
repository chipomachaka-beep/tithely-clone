/** @type {import('next').NextConfig} */
const nextConfig = {
  // Never reuse a page the browser already loaded when moving between pages:
  // money totals should always come straight from the database.
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
  // The treasurer pages moved under /dashboard. Old links still work.
  async redirects() {
    return [
      { source: "/pay", destination: "/dashboard/pay-bills", permanent: false },
      { source: "/envelope", destination: "/dashboard/record-gift", permanent: false },
    ];
  },
};

export default nextConfig;
