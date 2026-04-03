import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // Strict build — no ignoreBuildErrors / ignoreDuringBuilds
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Powered-By', value: 'EvoLinkAI' },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
