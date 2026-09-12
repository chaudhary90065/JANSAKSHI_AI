'use client'
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react'
import api from '@/lib/api'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const loginType = searchParams.get('type') || 'user'
  
  const [activeTab, setActiveTab] = useState<'user' | 'authority'>(loginType as 'user' | 'authority')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // User Login Form
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  // Authority Login Form
  const [authorityForm, setAuthorityForm] = useState({
    employeeId: '',
    password: '',
    department: '',
    rememberMe: false,
  })

  const departments = [
    'Public Works Department (PWD)',
    'Police Department',
    'Education Department',
    'Water Supply Department',
    'Electricity Board',
    'Sanitation Department',
  ]

  const handleUserLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  try {
    const response = await api.post('/api/auth/login', {
      email: userForm.email,
      password: userForm.password,
    })

    const { user, token } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOpts = `path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax${isProd ? '; secure' : ''}`
    document.cookie = `token=${token}; ${cookieOpts}`
    document.cookie = `role=citizen; ${cookieOpts}`

    router.push('/citizen')
  } catch (err: any) {
    setError(err.response?.data?.error || 'Invalid email or password')
  } finally {
    setIsLoading(false)
  }
}

    const handleAuthorityLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  try {
    const response = await api.post('/api/auth/login-authority', {
      employeeId: authorityForm.employeeId,
      password: authorityForm.password,
    })

    const { user, token } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    const dept = user.department || ''
    const role = dept.includes('Police') ? 'police' : dept.includes('Education') ? 'authority' : 'contractor'

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOpts = `path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax${isProd ? '; secure' : ''}`
    document.cookie = `token=${token}; ${cookieOpts}`
    document.cookie = `role=${role}; ${cookieOpts}`

    router.push(`/${role}`)
  } catch (err: any) {
    setError(err.response?.data?.error || 'Invalid credentials')
  } finally {
    setIsLoading(false)
  }
}
  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-white to-secondary">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)]">
          {/* Left Section - Branding */}
          <div className="hidden md:block">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold text-secondary mb-4">
                  JanaSakshi AI
                </h1>
                <p className="text-2xl font-semibold text-primary mb-2">
                  जन की आवाज़, प्रमाण के साथ।
                </p>
                <p className="text-xl text-gray-700">
                  The People's Voice, Backed by Evidence.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary text-white p-3 rounded-lg">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary text-lg">For Citizens</h3>
                    <p className="text-gray-600">
                      Submit complaints with evidence and track progress
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-accent text-white p-3 rounded-lg">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary text-lg">For Authorities</h3>
                    <p className="text-gray-600">
                      Manage complaints and ensure accountability
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-secondary text-white p-3 rounded-lg">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary text-lg">Real-time Updates</h3>
                    <p className="text-gray-600">
                      Get instant notifications on complaint status
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('user')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  activeTab === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-neutral text-secondary hover:bg-gray-300'
                }`}
              >
                👤 Citizen Login
              </button>
              <button
                onClick={() => setActiveTab('authority')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  activeTab === 'authority'
                    ? 'bg-secondary text-white'
                    : 'bg-neutral text-secondary hover:bg-gray-300'
                }`}
              >
                👮 Authority Login
              </button>
            </div>

            {/* User Login Form */}
            {activeTab === 'user' && (
              <form onSubmit={handleUserLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={userForm.rememberMe}
                      onChange={(e) => setUserForm({ ...userForm, rememberMe: e.target.checked })}
                      className="rounded"
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-orange-600">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login as Citizen'}
                </button>

                <p className="text-center text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary font-semibold hover:text-orange-600">
                    Register here
                  </Link>
                </p>
              </form>
            )}

            {/* Authority Login Form */}
            {activeTab === 'authority' && (
              <form onSubmit={handleAuthorityLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Employee ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={authorityForm.employeeId}
                      onChange={(e) => setAuthorityForm({ ...authorityForm, employeeId: e.target.value })}
                      placeholder="EMP-2026-001"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Department
                  </label>
                  <select
                    value={authorityForm.department}
                    onChange={(e) => setAuthorityForm({ ...authorityForm, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    required
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authorityForm.password}
                      onChange={(e) => setAuthorityForm({ ...authorityForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={authorityForm.rememberMe}
                      onChange={(e) => setAuthorityForm({ ...authorityForm, rememberMe: e.target.checked })}
                      className="rounded"
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-sm font-semibold text-secondary hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-secondary text-white font-semibold py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : 'Login as Authority'}
                </button>

                <p className="text-center text-gray-600 text-sm">
                  Contact your department administrator for login credentials
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
