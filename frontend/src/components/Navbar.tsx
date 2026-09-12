'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { getStoredUser, logout, StoredUser } from '@/lib/auth'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'mai', name: 'मैथिली' },
]

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showAuthDropdown, setShowAuthDropdown] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(null)

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  // Read logged-in user from localStorage once the component mounts
  // in the browser (localStorage isn't available during server render).
  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  function switchLanguage(code: string) {
    router.replace(pathname, { locale: code })
    setShowLanguageDropdown(false)
  }

  function handleLogout() {
    logout()
    setUser(null)
    setShowAuthDropdown(false)
    setIsOpen(false)
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg group-hover:shadow-hover transition">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-secondary hidden sm:block">
                JanaSakshi AI
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                {t('brandTagline')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-secondary font-medium hover:text-primary transition">
                {t('home')}
              </Link>
              <div className="relative group">
                <button className="text-secondary font-medium hover:text-primary transition flex items-center gap-1">
                  {t('forCitizens')}
                  <ChevronDown size={16} />
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-hover opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link href="/citizen/complaint" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral rounded-t-lg">
                    📝 {t('submitComplaint')}
                  </Link>
                  <Link href="/citizen/complaints" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral">
                    📊 {t('trackStatus')}
                  </Link>
                  <Link href="/citizen" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral">
                    ⭐ {t('giveFeedback')}
                  </Link>
                  {/* ===== BADGE SYSTEM (added) ===== */}
                  <Link href="/citizen/badges" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral rounded-b-lg">
                    🏅 My Badges
                  </Link>
                  {/* ===== END ADDED ===== */}
                </div>
              </div>
              <div className="relative group">
                <button className="text-secondary font-medium hover:text-primary transition flex items-center gap-1">
                  {t('forAuthorities')}
                  <ChevronDown size={16} />
                </button>
                <div className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-hover opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <Link href="/contractor" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral rounded-t-lg">
                    👷 {t('contractorDashboard')}
                  </Link>
                  <Link href="/police" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral">
                    🚔 {t('policeDashboard')}
                  </Link>
                  <Link href="/complaint-classifier" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral">
                    🤖 AI Complaint Classifier
                  </Link>
                  <Link href="/admin" className="block px-4 py-2 text-sm text-secondary hover:bg-neutral rounded-b-lg">
                    📈 {t('adminAnalytics')}
                  </Link>
                </div>
              </div>
              <Link href="/#about" className="text-secondary font-medium hover:text-primary transition">
                {t('about')}
              </Link>
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral text-secondary font-medium hover:bg-primary hover:text-white transition"
              >
                <span className="hidden sm:inline">{currentLanguage.name}</span>
                <ChevronDown size={16} />
              </button>
              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-hover border border-gray-200 max-h-80 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        locale === lang.code
                          ? 'bg-primary text-white font-semibold'
                          : 'text-secondary hover:bg-neutral'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons — shows Login/Register when logged out,
                shows user name + Logout dropdown when logged in */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-secondary bg-neutral hover:bg-gray-200 transition"
                >
                  👤 {user.name}
                  <ChevronDown size={16} />
                </button>
                {showAuthDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-hover border border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b truncate">
                      {user.role === 'authority' ? user.department : user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm font-medium text-danger hover:bg-neutral rounded-b-lg transition"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                    className="px-4 py-2 rounded-lg font-semibold text-white bg-primary hover:bg-orange-600 transition"
                  >
                    {t('login')}
                  </button>
                  {showAuthDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-hover border border-gray-200">
                      <Link
                        href="/login?type=user"
                        className="block px-4 py-3 text-sm font-medium text-secondary hover:bg-neutral rounded-t-lg transition"
                      >
                        👤 {t('loginAsUser')}
                      </Link>
                      <Link
                        href="/login?type=authority"
                        className="block px-4 py-3 text-sm font-medium text-secondary hover:bg-neutral rounded-b-lg transition"
                      >
                        👮 {t('loginAsAuthority')}
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('home')}
            </Link>
            <Link href="/citizen/complaint" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('submitComplaint')}
            </Link>
            <Link href="/citizen/complaints" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('trackComplaint')}
            </Link>
            {/* ===== BADGE SYSTEM (added) ===== */}
            <Link href="/citizen/badges" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              🏅 My Badges
            </Link>
            {/* ===== END ADDED ===== */}
            <Link href="/contractor" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('contractorDashboard')}
            </Link>
            <Link href="/police" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('policeDashboard')}
            </Link>
            <Link href="/complaint-classifier" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              🤖 AI Complaint Classifier
            </Link>
            <Link href="/admin" className="block px-4 py-2 text-secondary font-medium hover:bg-neutral rounded-lg">
              {t('adminAnalytics')}
            </Link>

            <div className="border-t pt-3">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 bg-neutral rounded-lg mb-2"
              >
                <span>{currentLanguage.name}</span>
                <ChevronDown size={16} />
              </button>
              {showLanguageDropdown && (
                <div className="space-y-1 mb-3 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition ${
                        locale === lang.code
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-neutral text-secondary'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Auth section — same logged-in/logged-out split as desktop */}
            <div className="space-y-2 border-t pt-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-center rounded-lg font-semibold text-white bg-danger hover:bg-red-700 transition"
                >
                  🚪 Logout ({user.name})
                </button>
              ) : (
                <>
                  <Link
                    href="/login?type=user"
                    className="block w-full px-4 py-2 text-center rounded-lg font-semibold text-white bg-primary hover:bg-orange-600 transition"
                  >
                    {t('loginAsUser')}
                  </Link>
                  <Link
                    href="/login?type=authority"
                    className="block w-full px-4 py-2 text-center rounded-lg font-semibold text-white bg-secondary hover:bg-blue-900 transition"
                  >
                    {t('loginAsAuthority')}
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full px-4 py-2 text-center rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition"
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}