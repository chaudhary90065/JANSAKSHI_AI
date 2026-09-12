export interface StoredUser {
  id: number
  name: string
  email: string
  role: string
  department?: string
  employeeId?: string
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  if (!raw || !token) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}