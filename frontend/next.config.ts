import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');


const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // ...rest of your config
}

export default withNextIntl(nextConfig);