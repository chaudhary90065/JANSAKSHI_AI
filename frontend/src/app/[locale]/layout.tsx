import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/routing'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import '../globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'JanaSakshi AI - Government Accountability Platform',
  description: 'जन की आवाज़, प्रमाण के साथ। The People\'s Voice, Backed by Evidence.',
  icons: {
    icon: '/favicon.ico',
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${poppins.variable} font-sans bg-neutral`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-secondary text-white mt-16">
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-lg mb-4 text-primary">JanaSakshi AI</h3>
                  <p className="text-gray-400 text-sm">
                    जन की आवाज़, प्रमाण के साथ।
                  </p>
                  <p className="text-gray-400 text-sm">
                    The People's Voice, Backed by Evidence.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">For Citizens</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-white transition">Submit Complaint</a></li>
                    <li><a href="#" className="hover:text-white transition">Track Status</a></li>
                    <li><a href="#" className="hover:text-white transition">Give Feedback</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">For Authorities</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-white transition">Dashboard</a></li>
                    <li><a href="#" className="hover:text-white transition">Analytics</a></li>
                    <li><a href="#" className="hover:text-white transition">Reports</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Contact</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Email: support@janasakshi.gov</li>
                    <li>Phone: +91-XXXX-XXXX-XX</li>
                    <li>Hours: 24/7 Support</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-8">
                <p className="text-center text-gray-400 text-sm">
                  © 2026 JanaSakshi AI. All rights reserved. |
                  <a href="#" className="hover:text-white ml-2">Privacy Policy</a> |
                  <a href="#" className="hover:text-white ml-2">Terms of Service</a>
                </p>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}