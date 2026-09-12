'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { ArrowRight, TrendingUp, Users, MapPin, Shield, Zap, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const t = useTranslations('home')

  const stats = [
    { number: '2,450+', label: t('stats.resolved') },
    { number: '98%', label: t('stats.satisfaction') },
    { number: '24/7', label: t('stats.support') },
    { number: '15+', label: t('stats.departments') },
  ]

  const features = [
    { icon: MapPin, title: t('features.gpsTitle'), description: t('features.gpsDesc') },
    { icon: Shield, title: t('features.aiTitle'), description: t('features.aiDesc') },
    { icon: Zap, title: t('features.trackingTitle'), description: t('features.trackingDesc') },
    { icon: BarChart3, title: t('features.analyticsTitle'), description: t('features.analyticsDesc') },
    { icon: TrendingUp, title: t('features.performanceTitle'), description: t('features.performanceDesc') },
    { icon: Users, title: t('features.multiDeptTitle'), description: t('features.multiDeptDesc') },
  ]

  const steps = [
    { num: '01', title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc') },
    { num: '02', title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc') },
    { num: '03', title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc') },
    { num: '04', title: t('howItWorks.step4Title'), desc: t('howItWorks.step4Desc') },
    { num: '05', title: t('howItWorks.step5Title'), desc: t('howItWorks.step5Desc') },
  ]

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-white to-secondary py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <span className="inline-block bg-primary/20 text-primary font-semibold px-4 py-1 rounded-full text-sm mb-4">
                  {t('badge')}
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-secondary leading-tight mb-4">
                  {t('heroTitleHi')}
                </h1>
                <p className="text-2xl text-gray-700 mb-6">
                  {t('heroSubtitle')}
                </p>
              </div>

              <p className="text-lg text-gray-600">
                {t('heroDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/citizen/complaint"
                  className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-lg hover:bg-orange-600 transition group"
                >
                  {t('submitComplaint')} <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="/citizen/complaints"
                  className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-4 rounded-lg hover:bg-primary hover:text-white transition"
                >
                  {t('trackComplaint')}
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="bg-gradient-to-br from-primary to-orange-500 rounded-xl p-6 text-white">
                  <div className="text-4xl font-bold mb-2">2,450+</div>
                  <p className="text-lg">{t('complaintsResolved')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-accent">
                    <div className="text-2xl font-bold text-accent">98%</div>
                    <p className="text-sm text-gray-600">{t('satisfactionRate')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-secondary">
                    <div className="text-2xl font-bold text-secondary">24/7</div>
                    <p className="text-sm text-gray-600">{t('support')}</p>
                  </div>
                </div>

                <div className="bg-neutral rounded-lg p-4">
                  <p className="text-sm font-semibold text-secondary mb-3">{t('latestUpdates')}</p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p>✅ {t('update1')}</p>
                    <p>✅ {t('update2')}</p>
                    <p>✅ {t('update3')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">{t('howItWorks.title')}</h2>
            <p className="text-lg text-gray-600">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-secondary text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">{t('features.title')}</h2>
            <p className="text-lg text-gray-600">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="bg-neutral rounded-xl p-8 hover:shadow-hover transition">
                  <div className="bg-primary text-white rounded-lg w-14 h-14 flex items-center justify-center mb-4">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-neutral py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-secondary mb-4">{t('about.title')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('about.description')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">{t('about.transparent')}</div>
              <p className="text-gray-600">{t('about.transparentDesc')}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">{t('about.accountable')}</div>
              <p className="text-gray-600">{t('about.accountableDesc')}</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">{t('about.verified')}</div>
              <p className="text-gray-600">{t('about.verifiedDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/citizen/complaint"
              className="bg-white text-primary font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition"
            >
              {t('cta.submitComplaint')}
            </Link>
            <Link
              href="/register"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-primary transition"
            >
              {t('cta.createAccount')}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-secondary mb-4">{t('faq.title')}</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-neutral rounded-lg p-6 cursor-pointer hover:shadow-card transition">
                <summary className="font-semibold text-secondary text-lg">
                  {faq.q}
                </summary>
                <p className="text-gray-600 mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}