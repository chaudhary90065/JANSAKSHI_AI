'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, FileText, User, RotateCcw, HourglassIcon } from 'lucide-react'
import { AIPrioritySuggestions } from '@/components/AIPrioritySuggestions'
import api from '@/lib/api'
import PriorityBadge from '@/components/PriorityBadge'

interface Complaint {
  id: number
  title: string
  description: string
  category: string
  status: string
  district: string | null
  block: string | null
  village: string | null
  address: string | null
  created_at: string
  reporter_name: string | null
  reporter_phone: string | null
  priority: string | null   // ← ye line add karo
  feedback_rating: number | null
  feedback_comment: string | null
}

interface Stats {
  activeComplaints: number
  resolvedComplaints: number
  performanceScore: number
  averageRating: number
  totalRatings: number
}

export default function PoliceDashboard() {
  const [token, setToken] = useState<string | null>(null)
  const [officer, setOfficer] = useState<any>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    setToken(storedToken)
    if (storedUser) setOfficer(JSON.parse(storedUser))

    if (storedToken) {
      fetchData(storedToken)
    }
  }, [])

  const fetchData = async (authToken: string) => {
    setLoading(true)
    setError('')
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get('/api/complaints', { headers: { Authorization: `Bearer ${authToken}` } }),
        api.get('/api/complaints/stats', { headers: { Authorization: `Bearer ${authToken}` } }),
      ])
      setComplaints(complaintsRes.data.complaints || [])
      setStats(statsRes.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, newStatus: string) => {
    if (!token) return
    try {
      await api.patch(
        `/api/complaints/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData(token)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status')
    }
  }

  const newCount = complaints.filter((c) => c.status === 'pending').length
  const underReviewCount = complaints.filter((c) => c.status === 'in_progress').length
  const waitingFeedbackCount = complaints.filter((c) => c.status === 'waiting_feedback').length
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-orange-100 text-warning border border-orange-300'
      case 'waiting_feedback':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      case 'resolved':
        return 'bg-green-100 text-accent border border-green-300'
      case 'unsatisfactory':
        return 'bg-red-100 text-danger border border-red-300'
      default:
        return 'bg-red-100 text-danger border border-red-300'
    }
  }

  // Custom labels — 'unsatisfactory' ke liye exact phrase jo chahiye tha
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'PENDING'
      case 'in_progress':
        return 'IN PROGRESS'
      case 'waiting_feedback':
        return 'WAITING FOR USER FEEDBACK'
      case 'resolved':
        return 'RESOLVED'
      case 'unsatisfactory':
        return 'YOUR WORK IS NOT SATISFACTORY'
      default:
        return status.replace(/_/g, ' ').toUpperCase()
    }
  }

  const formatLocation = (c: Complaint) =>
    [c.village, c.block, c.district, c.address].filter(Boolean).join(', ') || 'Not specified'

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-gray-600">Loading dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-2">Police Dashboard</h1>
        <p className="text-gray-600">Case tracking and complaint management system</p>
      </div>

      {/* Officer Profile */}
      <div className="bg-gradient-to-r from-secondary to-blue-900 text-white rounded-xl p-8 mb-12 shadow-hover">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">{officer?.department || 'Police Department'}</h2>
            <div className="space-y-2 text-sm opacity-90">
              <p>👮 Officer: {officer?.name || 'N/A'}</p>
              <p>🆔 Employee ID: {officer?.employeeId || 'N/A'}</p>
              <p>📧 Email: {officer?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center items-end">
            <p className="text-sm opacity-75 mb-2">Performance Score</p>
            <h3 className="text-4xl font-bold">{stats?.performanceScore ?? 0}</h3>
            <p className="text-sm opacity-75">
              Avg Rating: {stats?.averageRating ?? 0} ⭐ ({stats?.totalRatings ?? 0} ratings)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 mb-8">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-6 mb-12">
        {[
          { title: 'New Complaints', value: newCount, icon: AlertCircle, color: 'danger' },
          { title: 'Under Review', value: underReviewCount, icon: Clock, color: 'warning' },
          { title: 'Awaiting Feedback', value: waitingFeedbackCount, icon: HourglassIcon, color: 'yellow' },
          { title: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'accent' },
          { title: 'Total Cases', value: complaints.length, icon: FileText, color: 'primary' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600 text-sm">{stat.title}</h3>
                <div
                  className={`p-3 rounded-lg ${
                    stat.color === 'primary'
                      ? 'bg-primary/20'
                      : stat.color === 'accent'
                      ? 'bg-accent/20'
                      : stat.color === 'warning'
                      ? 'bg-warning/20'
                      : stat.color === 'yellow'
                      ? 'bg-yellow-100'
                      : 'bg-red-200/50'
                  }`}
                >
                  <Icon
                    className={
                      stat.color === 'primary'
                        ? 'text-primary'
                        : stat.color === 'accent'
                        ? 'text-accent'
                        : stat.color === 'warning'
                        ? 'text-warning'
                        : stat.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-danger'
                    }
                    size={24}
                  />
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary">{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Cases List */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">All Reported Cases</h2>
        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-card">
            Abhi tak Police department ko koi complaint assign nahi hui hai.
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-hover transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
  <h3 className="text-lg font-bold text-secondary">CASE-{c.id}</h3>
  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(c.status)}`}>
    {getStatusLabel(c.status)}
  </span>
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
    {c.category}
  </span>
  <PriorityBadge priority={c.priority} />
</div>
                      <p className="text-gray-700 font-semibold mb-2">{c.title}</p>
                      <p className="text-sm text-gray-500">{c.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6 pb-6 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <User size={12} /> Reported By
                      </p>
                      <p className="text-gray-700 font-medium">{c.reporter_name || 'Unknown'}</p>
                      {c.reporter_phone && <p className="text-xs text-gray-500">{c.reporter_phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                      <p className="text-gray-700 font-medium">{formatLocation(c)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Reported Date</p>
                      <p className="text-gray-700 font-medium">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Citizen feedback dikhao — resolved aur unsatisfactory dono cases mein */}
                  {(c.status === 'resolved' || c.status === 'unsatisfactory') && c.feedback_rating && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                      c.status === 'unsatisfactory' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Citizen Feedback</p>
                      <p className="text-sm text-gray-700 mb-1">Rating: {c.feedback_rating} / 5</p>
                      {c.feedback_comment && <p className="text-sm text-gray-600">{c.feedback_comment}</p>}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {c.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(c.id, 'in_progress')}
                        className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition"
                      >
                        📝 Mark Under Review
                      </button>
                    )}
                    {c.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(c.id, 'waiting_feedback')}
                        className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        ✓ Submit for Citizen Review
                      </button>
                    )}
                    {c.status === 'waiting_feedback' && (
                      <span className="flex-1 text-center py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-lg flex items-center justify-center gap-2">
                        <HourglassIcon size={18} /> Waiting for User Feedback
                      </span>
                    )}
                    {c.status === 'resolved' && (
                      <span className="flex-1 text-center py-2 text-accent font-semibold">✓ Resolved</span>
                    )}
                    {c.status === 'unsatisfactory' && (
                      <button
                        onClick={() => updateStatus(c.id, 'in_progress')}
                        className="flex-1 bg-danger text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={18} /> Reopen & Continue Work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Priority Suggestions */}
      {token && (
        <div className="mb-12">
          <AIPrioritySuggestions token={token} />
        </div>
      )}
    </div>
  )
}