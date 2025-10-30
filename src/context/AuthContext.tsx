import { createContext, useContext, useEffect, useState } from 'react'
import { authService, User } from '@/services/authService'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const u = await authService.getCurrentUser()
      setUser(u)
      setLoading(false)
    }
    init()
  }, [])

  const login = async (username: string, password: string) => {
    await authService.login(username, password)
    const u = await authService.getCurrentUser()
    setUser(u)
  }

  const register = async (username: string, email: string, password: string) => {
    await authService.register(username, email, password)
    await login(username, password)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
