'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle, Search } from 'lucide-react'
import api from '@/lib/api'

interface Complaint {
  id: number
  category: string
  title: string
  description: string
  district: string | null
  block: string | null
  village: string | null
  status: string
  created_at: string
  feedback_rating: number | null
}

export default function TrackComplaintPage() {
  const t = useTranslations('trackComplaint')
  const [complaintId, setComplaintId] = useState('')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintId.trim()) return

    setLoading(true)
    setError('')
    setComplaint(null)
    setSearched(true)

    try {
      const response = await api.get(`/api/complaints/${complaintId.trim()}`)
      setComplaint(response.data.complaint)
    } catch (err: any) {
      setError(err.response?.data?.error || t('notFound'))
    } finally {
      setLoading(false)
    }
  }

  // "Verified" step ab har status pe true hai jo pending se aage nikal chuka hai —
  // in_progress, waiting_feedback, resolved, ya unsatisfactory sab count hote hain
  const steps = [
    { key: 'submitted', label: t('stepSubmitted'), done: true },
    {
      key: 'verified',
      label: t('stepVerified'),
      done: complaint
        ? ['in_progress', 'waiting_feedback', 'resolved', 'unsatisfactory'].includes(complaint.status)
        : false,
    },
    {
      key: 'resolved',
      label: t('stepResolved'),
      done: complaint ? complaint.status === 'resolved' : false,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-secondary mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          type="text"
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={18} /> {loading ? t('searching') : t('searchButton')}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8 text-center">
          {error}
        </div>
      )}

      {complaint && (
        <div className="bg-white rounded-xl shadow-card p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-secondary mb-1">#{complaint.id} — {complaint.title}</h2>
            <p className="text-gray-500 text-sm">{complaint.category}</p>
          </div>

          <div className="space-y-6 mb-8">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {step.done ? (
                    <CheckCircle2 className="text-accent" size={28} />
                  ) : (
                    <Circle className="text-gray-300" size={28} />
                  )}
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-10 ${step.done ? 'bg-accent' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pt-1">
                  <p className={`font-semibold ${step.done ? 'text-secondary' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Waiting for user's feedback — department ne kaam complete kar diya hai */}
          {complaint.status === 'waiting_feedback' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-700 font-semibold text-lg mb-3">
                The department has completed work on this complaint.
              </p>
              <p className="text-gray-600 mb-4">
                Please log in and give your feedback to confirm the resolution.
              </p>
              <Link
                href="/citizen"
                className="inline-block bg-secondary text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-900 transition"
              >
                Give Feedback
              </Link>
            </div>
          )}

          {/* Resolved — citizen ne positive feedback diya */}
          {complaint.status === 'resolved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-accent font-semibold text-lg mb-3">
                {t('resolvedMessage')}
              </p>
              {complaint.feedback_rating && (
                <p className="text-gray-600 text-sm">{t('alreadyFeedback')}</p>
              )}
            </div>
          )}

          {/* Unsatisfactory — citizen ne negative feedback diya, dobara kaam ho raha hai */}
          {complaint.status === 'unsatisfactory' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-danger font-semibold text-lg mb-2">
                You marked this resolution as unsatisfactory.
              </p>
              <p className="text-gray-600 text-sm">
                The department has been notified and will redo the work. You'll get another chance to give feedback once it's resubmitted.
              </p>
            </div>
          )}
        </div>
      )}

      {searched && !complaint && !error && !loading && (
        <div className="text-center text-gray-500">{t('noResult')}</div>
      )}
    </div>
  )
}