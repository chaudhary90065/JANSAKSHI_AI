import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi', 'bn', 'or', 'ta', 'mr', 'gu', 'mai'],
  defaultLocale: 'en'
});