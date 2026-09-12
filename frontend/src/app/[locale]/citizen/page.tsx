'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, TrendingUp, CheckCircle2, Clock, AlertCircle, Star, Paperclip, X, Hourglass } from 'lucide-react'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'

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
  feedback_evidence: string | null
  feedback_evidence_type: 'photo' | 'audio' | 'video' | null
}

export default function CitizenDashboard() {
  const t = useTranslations('citizenDashboard')
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackOpenId, setFeedbackOpenId] = useState<number | null>(null)
  const [ratingInput, setRatingInput] = useState(0)
  const [commentInput, setCommentInput] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null)
  const [evidenceType, setEvidenceType] = useState<'photo' | 'audio' | 'video' | null>(null)
  const [evidenceError, setEvidenceError] = useState('')

  useEffect(() => {
    const user = getStoredUser()
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'citizen') {
      router.push('/login')
      return
    }
    fetchComplaints()
  }, [router])

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/api/complaints/mine')
      setComplaints(response.data.complaints)
    } catch (err: any) {
      setError(err.response?.data?.error || t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  const openFeedback = (id: number) => {
    setFeedbackOpenId(id)
    setRatingInput(0)
    setCommentInput('')
    setEvidenceFile(null)
    setEvidenceType(null)
    setEvidenceError('')
  }

  const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024 // 15MB

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setEvidenceError('')

    if (file.size > MAX_EVIDENCE_BYTES) {
      setEvidenceError(`File too large. Max size is ${MAX_EVIDENCE_BYTES / (1024 * 1024)}MB.`)
      e.target.value = ''
      return
    }

    let type: 'photo' | 'audio' | 'video' | null = null
    if (file.type.startsWith('image/')) type = 'photo'
    else if (file.type.startsWith('audio/')) type = 'audio'
    else if (file.type.startsWith('video/')) type = 'video'
    else {
      setEvidenceError('Only photo, audio, or video files are allowed.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setEvidenceFile(event.target?.result as string)
      setEvidenceType(type)
    }
    reader.readAsDataURL(file)
  }

  const submitFeedback = async (id: number) => {
    if (ratingInput < 1) {
      alert(t('ratingAlert'))
      return
    }
    setSubmittingFeedback(true)
    try {
      // Backend rating dekh kar decide karta hai: 3+ stars -> resolved, 1-2 stars -> unsatisfactory
      const response = await api.patch(`/api/complaints/${id}/feedback`, {
        rating: ratingInput,
        comment: commentInput,
        evidence: evidenceFile,
        evidenceType: evidenceType,
      })
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? response.data.complaint : c))
      )
      setFeedbackOpenId(null)
    } catch (err: any) {
      alert(err.response?.data?.error || t('feedbackError'))
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="text-accent" size={20} />
      case 'unsatisfactory':
        return <AlertCircle className="text-danger" size={20} />
      case 'waiting_feedback':
        return <Hourglass className="text-yellow-600" size={20} />
      case 'in_progress':
        return <TrendingUp className="text-warning" size={20} />
      default:
        return <Clock className="text-primary" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-accent border border-green-300'
      case 'unsatisfactory':
        return 'bg-red-100 text-danger border border-red-300'
      case 'waiting_feedback':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      case 'in_progress':
        return 'bg-orange-100 text-warning border border-orange-300'
      default:
        return 'bg-blue-100 text-primary border border-blue-300'
    }
  }

  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === 'resolved').length
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length
  const pending = complaints.filter((c) => c.status === 'pending').length
  const waitingFeedback = complaints.filter((c) => c.status === 'waiting_feedback').length

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-6 mb-12">
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">{t('totalComplaints')}</h3>
            <div className="bg-primary/20 p-3 rounded-lg">
              <AlertCircle className="text-primary" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-secondary">{total}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">{t('resolved')}</h3>
            <div className="bg-accent/20 p-3 rounded-lg">
              <CheckCircle2 className="text-accent" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-accent">{resolved}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">{t('inProgress')}</h3>
            <div className="bg-warning/20 p-3 rounded-lg">
              <TrendingUp className="text-warning" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-warning">{inProgress}</div>
        </div>

        {/* Naya card — action needed hai to highlight karta hai */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">Awaiting Your Feedback</h3>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Hourglass className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{waitingFeedback}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600">{t('pending')}</h3>
            <div className="bg-primary/20 p-3 rounded-lg">
              <Clock className="text-primary" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-primary">{pending}</div>
        </div>
      </div>

      <div className="mb-12">
        <Link
          href="/citizen/complaint"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition"
        >
          <Plus size={20} /> {t('submitNew')}
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center text-gray-600">
          {t('noComplaints')}
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-hover transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-secondary">#{complaint.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">{complaint.title}</p>
                    <p className="text-gray-500 text-sm">{complaint.description}</p>
                  </div>
                  {getStatusIcon(complaint.status)}
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('category')}</p>
                    <p className="text-gray-700 font-medium">{complaint.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('location')}</p>
                    <p className="text-gray-700 font-medium">
                      {[complaint.village, complaint.block, complaint.district].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('submitted')}</p>
                    <p className="text-gray-700 font-medium">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Completion photo — waiting_feedback aur unsatisfactory mein bhi dikhega,
                    kyunki photo complete step pe hi upload ho chuki hoti hai */}
                {(complaint.status === 'resolved' || complaint.status === 'waiting_feedback' || complaint.status === 'unsatisfactory') && complaint.completion_photo && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('completionPhoto')}</p>
                    <img
                      src={complaint.completion_photo}
                      alt="Completed work"
                      className="rounded-lg max-h-64 border border-gray-200"
                    />
                  </div>
                )}

                {/* Unsatisfactory case mein reassurance message */}
                {complaint.status === 'unsatisfactory' && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-danger font-semibold text-sm">
                      You marked this as unsatisfactory. The department has been notified and will redo the work.
                    </p>
                  </div>
                )}

                {/* Feedback section — ab 'waiting_feedback' status pe trigger hota hai,
                    'resolved' pe nahi (jo ki feedback ka RESULT hai, cause nahi) */}
                {(complaint.status === 'waiting_feedback' || complaint.status === 'resolved' || complaint.status === 'unsatisfactory') && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    {complaint.feedback_rating ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('yourFeedback')}</p>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={20}
                              className={n <= complaint.feedback_rating! ? 'text-warning fill-warning' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        {complaint.feedback_comment && (
                          <p className="text-gray-600 text-sm">{complaint.feedback_comment}</p>
                        )}
                        {complaint.feedback_evidence && complaint.feedback_evidence_type && (
                          <div className="mt-3">
                            {complaint.feedback_evidence_type === 'photo' && (
                              <img src={complaint.feedback_evidence} alt="Feedback evidence" className="max-h-48 rounded-lg border border-gray-200" />
                            )}
                            {complaint.feedback_evidence_type === 'audio' && (
                              <audio src={complaint.feedback_evidence} controls className="max-w-xs" />
                            )}
                            {complaint.feedback_evidence_type === 'video' && (
                              <video src={complaint.feedback_evidence} controls className="max-h-48 rounded-lg border border-gray-200" />
                            )}
                          </div>
                        )}
                      </div>
                    ) : feedbackOpenId === complaint.id ? (
                      <div className="bg-neutral rounded-lg p-4">
                        <p className="text-sm font-semibold text-secondary mb-2">{t('rateResolution')}</p>
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setRatingInput(n)}>
                              <Star
                                size={28}
                                className={n <= ratingInput ? 'text-warning fill-warning' : 'text-gray-300'}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder={t('commentPlaceholder')}
                          className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm"
                          rows={2}
                        />
                        <div className="mb-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2 cursor-pointer">
                            <Paperclip size={16} /> Attach evidence (photo, audio, or video — optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*,audio/*,video/*"
                            onChange={handleEvidenceUpload}
                            className="text-sm"
                          />
                          {evidenceError && (
                            <p className="text-red-600 text-xs mt-1">{evidenceError}</p>
                          )}
                          {evidenceFile && evidenceType && (
                            <div className="mt-3 relative inline-block">
                              <button
                                type="button"
                                onClick={() => { setEvidenceFile(null); setEvidenceType(null) }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10"
                              >
                                <X size={14} />
                              </button>
                              {evidenceType === 'photo' && (
                                <img src={evidenceFile} alt="Evidence preview" className="max-h-40 rounded-lg border border-gray-300" />
                              )}
                              {evidenceType === 'audio' && (
                                <audio src={evidenceFile} controls className="max-w-xs" />
                              )}
                              {evidenceType === 'video' && (
                                <video src={evidenceFile} controls className="max-h-40 rounded-lg border border-gray-300" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitFeedback(complaint.id)}
                            disabled={submittingFeedback}
                            className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                          >
                            {submittingFeedback ? t('submittingFeedback') : t('submitFeedbackBtn')}
                          </button>
                          <button
                            onClick={() => setFeedbackOpenId(null)}
                            className="text-gray-600 font-semibold px-4 py-2"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : complaint.status === 'waiting_feedback' ? (
                      <button
                        onClick={() => openFeedback(complaint.id)}
                        className="bg-secondary text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-900 transition"
                      >
                        {t('giveFeedback')}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}