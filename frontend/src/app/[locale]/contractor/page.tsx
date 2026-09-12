'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Upload, Star, User, Briefcase, RotateCcw, HourglassIcon } from 'lucide-react'
import api from '@/lib/api'
import PriorityBadge from '@/components/PriorityBadge'

interface Complaint {
  id: number
  category: string
  title: string
  description: string
  district: string | null
  block: string | null
  village: string | null
  address: string | null
  status: string
  priority: string
  created_at: string
  completion_photo: string | null
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

interface UserInfo {
  name: string
  email: string
  role: string
  department?: string
  employeeId?: string
}

export default function ContractorDashboard() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [uploadOpenId, setUploadOpenId] = useState<number | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?type=authority')
      return
    }
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      const dept = parsedUser.department || ''

      if (dept.includes('Police')) {
        router.push('/police')
        return
      }
      if (dept.includes('Education')) {
        router.push('/authority')
        return
      }

      setUserInfo(parsedUser)
    }
    fetchComplaints()
    fetchStats()
  }, [router])

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/api/complaints')
      setComplaints(response.data.complaints)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/complaints/stats')
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to load stats', err)
    }
  }

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id)
    try {
      await api.patch(`/api/complaints/${id}/status`, { status: newStatus })
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      )
      fetchStats()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const submitCompletion = async (id: number) => {
    if (!selectedPhoto) {
      alert('Please choose a photo of the completed work first')
      return
    }
    setUpdatingId(id)
    try {
      // Backend ab isse 'waiting_feedback' status set karta hai, seedha 'resolved' nahi
      const response = await api.patch(`/api/complaints/${id}/complete`, {
        completionPhoto: selectedPhoto,
      })
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? response.data.complaint : c))
      )
      setUploadOpenId(null)
      setSelectedPhoto(null)
      fetchStats()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit for review')
    } finally {
      setUpdatingId(null)
    }
  }

  // Unsatisfactory feedback ke baad contractor dobara kaam shuru kar sakta hai
  const reopenWork = async (id: number) => {
    await updateStatus(id, 'in_progress')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-secondary border border-blue-300'
      case 'in_progress':
        return 'bg-orange-100 text-warning border border-orange-300'
      case 'waiting_feedback':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      case 'resolved':
        return 'bg-green-100 text-accent border border-green-300'
      case 'unsatisfactory':
        return 'bg-red-100 text-danger border border-red-300'
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300'
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

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={22}
          fill={i <= Math.round(rating) ? '#FFD700' : 'none'}
          stroke={i <= Math.round(rating) ? '#FFD700' : '#ccc'}
        />
      )
    }
    return stars
  }

  const stats_display = [
    { title: 'Active Complaints', value: stats ? String(stats.activeComplaints) : '0', icon: AlertCircle, color: 'primary' },
    { title: 'Resolved', value: stats ? String(stats.resolvedComplaints) : '0', icon: CheckCircle2, color: 'accent' },
    { title: 'Performance Score', value: stats ? String(stats.performanceScore) : '0', icon: TrendingUp, color: 'warning' },
  ]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600">
        Loading complaints...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-2">Contractor Dashboard</h1>
        <p className="text-gray-600">Manage assigned complaints and track performance</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl p-8 mb-12 shadow-hover">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Contractor Profile</h2>
            {userInfo ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span className="font-semibold">{userInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={18} />
                  <span>{userInfo.department || 'No department assigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-80">Employee ID:</span>
                  <span className="font-semibold">{userInfo.employeeId || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="opacity-90 text-sm">Profile details not available.</p>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm opacity-90 mb-2">Public Feedback Rating</p>
            <div className="flex items-center gap-1 mb-1">
              {stats ? renderStars(stats.averageRating) : renderStars(0)}
            </div>
            <p className="text-sm opacity-90">
              {stats && stats.totalRatings > 0
                ? `${stats.averageRating} / 5 (${stats.totalRatings} ratings)`
                : 'No ratings yet'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {stats_display.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600">{stat.title}</h3>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'primary' ? 'bg-primary/20' :
                  stat.color === 'accent' ? 'bg-accent/20' :
                  'bg-warning/20'
                }`}>
                  <Icon className={`${
                    stat.color === 'primary' ? 'text-primary' :
                    stat.color === 'accent' ? 'text-accent' :
                    'text-warning'
                  }`} size={24} />
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary">{stat.value}</div>
            </div>
          )
        })}
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">
          {userInfo?.department ? `${userInfo.department} — Complaints` : 'All Complaints'}
        </h2>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center text-gray-600">
            No complaints assigned to your department yet.
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-hover transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-secondary">#{complaint.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <p className="text-gray-700 font-semibold mb-3">{complaint.title}</p>
                      <p className="text-gray-500 text-sm mb-3">{complaint.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</p>
                      <p className="text-gray-700 font-medium">{complaint.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                      <p className="text-gray-700 font-medium">
                        {[complaint.village, complaint.block, complaint.district].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Submitted</p>
                      <p className="text-gray-700 font-medium">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Completion photo — ab waiting_feedback aur unsatisfactory states mein bhi dikhega,
                      kyunki photo already complete step pe upload ho chuki hoti hai */}
                  {(complaint.status === 'resolved' || complaint.status === 'waiting_feedback' || complaint.status === 'unsatisfactory') && complaint.completion_photo && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Completion Photo</p>
                      <img
                        src={complaint.completion_photo}
                        alt="Completed work"
                        className="rounded-lg max-h-64 border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Citizen ka feedback dikhao — dono resolved aur unsatisfactory case mein,
                      taaki contractor ko pata chale rating/comment kya mila */}
                  {(complaint.status === 'resolved' || complaint.status === 'unsatisfactory') && complaint.feedback_rating && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                      complaint.status === 'unsatisfactory'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Citizen Feedback</p>
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(complaint.feedback_rating)}
                      </div>
                      {complaint.feedback_comment && (
                        <p className="text-gray-700 text-sm">{complaint.feedback_comment}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(complaint.id, 'in_progress')}
                        disabled={updatingId === complaint.id}
                        className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                      >
                        {updatingId === complaint.id ? 'Updating...' : 'Start Work (Mark In Progress)'}
                      </button>
                    )}

                    {complaint.status === 'in_progress' && uploadOpenId !== complaint.id && (
                      <button
                        onClick={() => { setUploadOpenId(complaint.id); setSelectedPhoto(null) }}
                        className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <Upload size={18} /> Upload Photo & Submit for Review
                      </button>
                    )}

                    {complaint.status === 'waiting_feedback' && (
                      <button disabled className="flex-1 bg-yellow-100 text-yellow-700 font-semibold py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                        <HourglassIcon size={18} /> Waiting for User Feedback
                      </button>
                    )}

                    {complaint.status === 'resolved' && (
                      <button disabled className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg cursor-not-allowed">
                        ✓ Resolved
                      </button>
                    )}

                    {complaint.status === 'unsatisfactory' && (
                      <button
                        onClick={() => reopenWork(complaint.id)}
                        disabled={updatingId === complaint.id}
                        className="flex-1 bg-danger text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={18} /> {updatingId === complaint.id ? 'Reopening...' : 'Reopen & Continue Work'}
                      </button>
                    )}
                  </div>

                  {uploadOpenId === complaint.id && (
                    <div className="mt-4 bg-neutral rounded-lg p-4">
                      <p className="text-sm font-semibold text-secondary mb-2">
                        Upload a photo of the completed work
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="mb-3 text-sm"
                      />
                      {selectedPhoto && (
                        <img src={selectedPhoto} alt="Preview" className="rounded-lg max-h-48 mb-3 border border-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={() => submitCompletion(complaint.id)}
                          disabled={updatingId === complaint.id}
                          className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                        >
                          {updatingId === complaint.id ? 'Submitting...' : 'Submit for Review'}
                        </button>
                        <button
                          onClick={() => { setUploadOpenId(null); setSelectedPhoto(null) }}
                          className="text-gray-600 font-semibold px-4 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}