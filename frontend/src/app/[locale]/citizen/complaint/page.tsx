
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Upload, Check, Loader } from 'lucide-react'
import api from '@/lib/api'
import LocationMapPicker from '@/components/LocationMapPicker'

export default function SubmitComplaintPage() {
  const t = useTranslations('complaintForm')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    district: '',
    block: '',
    village: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  const categories = [
    { value: 'ROAD', label: t('categories.road') },
    { value: 'WATER', label: t('categories.water') },
    { value: 'SCHOOL', label: t('categories.school') },
    { value: 'ELECTRICITY', label: t('categories.electricity') },
    { value: 'SANITATION', label: t('categories.sanitation') },
    { value: 'DRAINAGE', label: t('categories.drainage') },
    { value: 'POLICE', label: t('categories.police') },
    { value: 'OTHER', label: t('categories.other') },
  ]

  const districts = ['Bhubaneswar', 'Cuttack', 'Puri', 'Khurda', 'Dhenkanal', 'Balasore']
  const blocks = ['Block 1', 'Block 2', 'Block 3']

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await api.post('/api/complaints', {
        category: form.category,
        title: form.title,
        description: form.description,
        district: form.district,
        block: form.block,
        village: form.village,
        address: form.address,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      })

      alert(`${t('successAlert')} ${response.data.complaint.id}`)
      router.push('/citizen')
    } catch (error: any) {
      alert(error.response?.data?.error || t('errorAlert'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-2">{t('pageTitle')}</h1>
        <p className="text-gray-600">{t('pageSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">

        {/* Step 1: Category Selection */}
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            {t('step1Title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  form.category === cat.value
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 hover:border-primary bg-white'
                }`}
              >
                <div className="font-semibold text-secondary">{cat.label}</div>
              </button>
            ))}
          </div>

          {form.category && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="text-accent" size={20} />
              <p className="text-green-700">
                {t('categorySelected')} <span className="font-semibold">{categories.find(c => c.value === form.category)?.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Complaint Details */}
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            {t('step2Title')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t('titleLabel')}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('titlePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t('descriptionLabel')}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-32"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location Details */}
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            {t('step3Title')}
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  {t('districtLabel')}
                </label>
                <select
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">{t('districtPlaceholder')}</option>
                  {districts.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  {t('blockLabel')}
                </label>
                <select
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('blockPlaceholder')}</option>
                  {blocks.map((block) => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t('villageLabel')}
              </label>
              <input
                type="text"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder={t('villagePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* ===== YAHAN NAYA MAP COMPONENT AAYA HAI ===== */}
            {/* Purana Address textarea + purana GPS blue box — dono hata diye,
                inki jagah ye ek component sab kuch (address input + map + pin) handle karta hai */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                {t('addressLabel')}
              </label>
              <LocationMapPicker
                address={form.address}
                onAddressChange={(addr) => setForm((prev) => ({ ...prev, address: addr }))}
                onLocationSelect={(lat, lng) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                  }))
                }
                latitude={form.latitude}
                longitude={form.longitude}
              />
            </div>

            {/* Coordinates dikhane ke liye (optional — map pe pin already dikh raha hoga) */}
            {form.latitude && form.longitude && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{t('latitude')}</p>
                  <p className="font-mono text-sm text-secondary">{form.latitude}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{t('longitude')}</p>
                  <p className="font-mono text-sm text-secondary">{form.longitude}</p>
                </div>
              </div>
            )}
            {/* ===== NAYA COMPONENT YAHAN KHATAM ===== */}

          </div>
        </div>

        {/* Step 4: Evidence Upload */}
        <div>
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            {t('step4Title')}
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadedImage ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={uploadedImage}
                    alt="Complaint evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="text-accent" size={20} />
                  <p className="text-green-700">{t('uploadSuccess')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-neutral text-secondary font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('changeImage')}
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="text-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition"
              >
                <Upload className="mx-auto text-primary mb-3" size={40} />
                <h3 className="font-semibold text-secondary mb-2">{t('uploadTitle')}</h3>
                <p className="text-gray-600 text-sm">{t('uploadDesc')}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {t('uploadHint')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-secondary font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !form.category || !form.title || !form.description || !form.district || !form.address}
            className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader size={20} className="animate-spin" /> {t('submitting')}
              </>
            ) : (
              t('submitButton')
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
