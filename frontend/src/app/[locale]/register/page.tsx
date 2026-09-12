'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'citizen' | 'authority'>('citizen')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    district: '',
    address: '',
    // Authority fields
    employeeId: '',
    department: '',
    designation: '',
  })

  const districts = [
    'Bhubaneswar', 'Cuttack', 'Puri', 'Khurda', 'Dhenkanal',
    'Balasore', 'Bargarh', 'Balangir', 'Kandhamal', 'Koraput',
  ]

  const departments = [
    'Public Works Department (PWD)',
    'Police Department',
    'Education Department',
    'Water Supply Department',
    'Electricity Board',
    'Sanitation Department',
  ]

    const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/api/auth/register', {
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: userType === 'citizen' ? 'citizen' : 'admin',
        phone: form.phone,
        district: form.district,
        employeeId: form.employeeId,
        department: form.department,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push(`/login?type=${userType === 'citizen' ? 'user' : 'authority'}`)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary via-white to-secondary flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
          <CheckCircle2 size={64} className="mx-auto text-accent mb-4" />
          <h2 className="text-2xl font-bold text-secondary mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created. Redirecting to login page...
          </p>
          <div className="animate-pulse flex justify-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-white to-secondary py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary mb-2">Create Your Account</h1>
          <p className="text-gray-700">Join JanaSakshi AI to make a difference</p>
        </div>

        {/* Type Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setUserType('citizen')}
            className={`p-6 rounded-xl border-2 transition ${
              userType === 'citizen'
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 bg-white hover:border-primary'
            }`}
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-semibold text-lg text-secondary">Register as Citizen</h3>
            <p className="text-sm text-gray-600">Submit complaints and track status</p>
          </button>

          <button
            onClick={() => setUserType('authority')}
            className={`p-6 rounded-xl border-2 transition ${
              userType === 'authority'
                ? 'border-secondary bg-secondary/10'
                : 'border-gray-300 bg-white hover:border-secondary'
            }`}
          >
            <div className="text-3xl mb-2">👮</div>
            <h3 className="font-semibold text-lg text-secondary">Register as Authority</h3>
            <p className="text-sm text-gray-600">Manage complaints and departments</p>
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Common Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91-XXXX-XXXX-XX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  District *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="">Select your district</option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Citizen-specific fields */}
            {userType === 'citizen' && (
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter your full address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </div>
            )}

            {/* Authority-specific fields */}
            {userType === 'authority' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    placeholder="EMP-2026-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Department *
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
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
              </div>
            )}

            {userType === 'authority' && (
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Designation *
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g., Deputy Collector, Inspector, Head Master"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  required
                />
              </div>
            )}

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                <p className="text-xs text-gray-500 mt-1">Min. 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Terms & Privacy */}
            <div className="bg-neutral rounded-lg p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  required
                  className="mt-1"
                />
                <span className="text-gray-700">
                  I agree to the{' '}
                  <Link href="#" className="text-primary font-semibold hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="#" className="text-primary font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold py-3 rounded-lg text-white transition ${
                userType === 'citizen'
                  ? 'bg-primary hover:bg-orange-600 disabled:bg-orange-300'
                  : 'bg-secondary hover:bg-blue-900 disabled:bg-blue-300'
              }`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:text-orange-600">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
