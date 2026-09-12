'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, LocateFixed, Loader2 } from 'lucide-react'

interface LocationMapPickerProps {
  address: string
  onAddressChange: (address: string) => void
  onLocationSelect: (lat: number, lng: number) => void
  latitude?: string
  longitude?: string
}

declare global {
  interface Window {
    google: any
  }
}

let googleMapsLoadingPromise: Promise<void> | null = null

export default function LocationMapPicker({
  address,
  onAddressChange,
  onLocationSelect,
  latitude,
  longitude,
}: LocationMapPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Load Google Maps script once
  useEffect(() => {
    if (window.google?.maps) {
      setScriptLoaded(true)
      return
    }

    if (!googleMapsLoadingPromise) {
      googleMapsLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google Maps'))
        document.head.appendChild(script)
      })
    }

    googleMapsLoadingPromise
      .then(() => setScriptLoaded(true))
      .catch((err) => console.error(err))
  }, [])

  // Init map + autocomplete once script is ready
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !inputRef.current) return

    const defaultCenter = { lat: 20.5937, lng: 78.9629 } // India center
    const startLat = latitude ? parseFloat(latitude) : defaultCenter.lat
    const startLng = longitude ? parseFloat(longitude) : defaultCenter.lng

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: startLat, lng: startLng },
      zoom: latitude ? 15 : 5,
    })
    mapInstanceRef.current = map
    geocoderRef.current = new window.google.maps.Geocoder()

    const marker = new window.google.maps.Marker({
      position: { lat: startLat, lng: startLng },
      map,
      draggable: true,
    })
    markerRef.current = marker

    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      onLocationSelect(pos.lat(), pos.lng())
    })

    map.addListener('click', (e: any) => {
      marker.setPosition(e.latLng)
      onLocationSelect(e.latLng.lat(), e.latLng.lng())
    })

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry) return
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      map.setCenter({ lat, lng })
      map.setZoom(16)
      marker.setPosition({ lat, lng })
      onAddressChange(place.formatted_address || '')
      onLocationSelect(lat, lng)
    })
  }, [scriptLoaded])

  function handleUseCurrentLocation() {
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Ye browser geolocation support nahi karta. Kripya manually location dalein.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(16)
          markerRef.current.setPosition({ lat, lng })
        }
        onLocationSelect(lat, lng)

        // Reverse geocode to fill the address text field
                // Reverse geocode using free OpenStreetMap Nominatim API (no billing needed)
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              onAddressChange(data.display_name)
            }
          })
          .catch((err) => console.error('Reverse geocoding failed:', err))
          .finally(() => setLocating(false))
      },
      (error) => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            'Location access denied. Browser settings mein is site ke liye location allow karein, ya manually location dalein.'
          )
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Location abhi available nahi hai. Kripya manually location dalein.')
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Location fetch karne mein zyada time lag gaya. Dobara try karein.')
        } else {
          setLocationError('Location fetch nahi ho paayi. Kripya manually location dalein.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Address type karna shuru karo..."
          className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="absolute right-2 top-1.5 flex items-center gap-1 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-md hover:bg-primary/5 disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <LocateFixed size={16} />
          )}
          {locating ? 'Locating...' : 'Mera location'}
        </button>
      </div>
      {locationError && (
        <p className="text-xs text-red-600">{locationError}</p>
      )}
      <div ref={mapRef} className="w-full h-64 rounded-lg border border-gray-300" />
      <p className="text-xs text-gray-500">
        Map pe click karo ya pin drag karo exact location set karne ke liye
      </p>
    </div>
  )
}