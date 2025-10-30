import { createContext, useContext, useEffect, useState } from 'react'
import { authService, User } from '@/services/authService'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>  // 👈 добавили сюда
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Загружаем пользователя при монтировании
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await authService.getCurrentUser()
        setUser(u)
      } catch (err) {
        console.error('Ошибка при загрузке пользователя:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // 🔹 Авторизация
  const login = async (username: string, password: string) => {
    await authService.login(username, password)
    const u = await authService.getCurrentUser()
    setUser(u)
  }

  // 🔹 Регистрация
  const register = async (username: string, email: string, password: string) => {
    await authService.register(username, email, password)
    await login(username, password)
  }

  // 🔹 Выход
  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  // 🔹 Обновление данных пользователя (например, после апдейта профиля или аватара)
  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getCurrentUser()
      setUser(updatedUser)
    } catch (err) {
      console.error('Ошибка при обновлении пользователя:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser, 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
