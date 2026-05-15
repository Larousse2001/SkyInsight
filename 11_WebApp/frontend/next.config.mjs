/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  async rewrites() {
    return [
      // NLP API (10_NLP/app/api.py) — runs on port 8001
      {
        source: "/api/nlp/:path*",
        destination: "http://localhost:8001/:path*",
      },
      // Core SkyInsight API (11_WebApp/backend) — port 8000
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
