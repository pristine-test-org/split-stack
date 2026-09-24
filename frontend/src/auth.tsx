import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, post, type User } from './api'

interface AuthState {
  // undefined while the first /me call is in flight
  user: User | null | undefined
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setUser(await post<User>('/auth/login', { username, password }))
  }, [])

  const logout = useCallback(async () => {
    await post('/auth/logout')
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
