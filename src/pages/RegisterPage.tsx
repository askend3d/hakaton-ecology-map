import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await register(username, email, password)
      navigate('/')
    } catch {
      setError('Ошибка при регистрации. Проверьте введённые данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* фон */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-100 via-white to-sky-200" />
      <div className="absolute inset-0 backdrop-blur-[100px] opacity-60" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl animate-pulse" />

      <Card className="relative w-full max-w-md shadow-lg border border-border/50 bg-white/75 backdrop-blur-md p-2">
        <CardHeader className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center text-cyan-700 hover:text-cyan-800 transition text-sm font-medium w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Назад
          </button>
          <CardTitle className="text-2xl font-bold text-center text-cyan-800">
            Регистрация
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="py-3 text-base"
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="py-3 text-base"
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="py-3 text-base"
            />
            <Input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="py-3 text-base"
            />
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full py-3 text-base bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
          <p className="mt-5 text-sm text-center text-gray-700">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-cyan-700 hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
