// src/utils/geolocation.ts
// Feature: Live GPS Location Auto-Detection & Reverse Geocoding
// Browser ki HTML5 Geolocation API se lat/lng leta hai, phir OpenStreetMap
// (Nominatim) se use readable address mein badalta hai.
//
// NOTE: tumhare .env.local mein NEXT_PUBLIC_GOOGLE_MAPS_API_KEY bhi hai —
// agar kabhi Nominatim ki jagah Google's Geocoding API use karna ho (zyada
// accurate India mein, lekin paid/quota-limited), neeche
// `reverseGeocodeWithGoogleMaps` bhi diya hai as an optional alternative.

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
}

export const detectLiveLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Aapke browser mein Geolocation support uplabdh nahi hai.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          resolve({
            latitude,
            longitude,
            address: data.display_name || `Lat: ${latitude}, Lng: ${longitude}`,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || '',
          });
        } catch {
          // API fail ho jaaye to bhi sirf coordinates return kar do
          resolve({
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
          });
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission deny ki gayi. Kripya browser settings se permission dein.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location ki jaankari nahi mil payi.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location detect karne mein time out ho gaya.'));
            break;
          default:
            reject(new Error('Anjaan error hui.'));
        }
      },
      {
        enableHighAccuracy: true, // sateek GPS ke liye
        timeout: 10000,           // 10 second time limit
        maximumAge: 0,            // har baar taaza location lo
      }
    );
  });
};

// Optional alternative: Google Maps Geocoding API (tumhare .env.local mein
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY already maujood hai). Client-side call karne
// par key browser mein visible hoti hai (NEXT_PUBLIC_ isi liye hai), to Google
// Cloud Console mein is key ko "HTTP referrer" se apne domain tak restrict
// zaroor kar lena.
export const reverseGeocodeWithGoogleMaps = async (
  latitude: number,
  longitude: number
): Promise<LocationData> => {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`
  );
  const data = await response.json();
  const result = data.results?.[0];
  const components = result?.address_components || [];
  const city = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
  const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';

  return {
    latitude,
    longitude,
    address: result?.formatted_address || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
    city,
    state,
  };
};