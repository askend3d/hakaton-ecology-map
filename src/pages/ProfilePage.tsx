import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import Cookies from 'js-cookie'
import { Camera, LogOut, MapIcon, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
	const { user, logout, refreshUser } = useAuth()

	const navigate = useNavigate()
	const [avatar, setAvatar] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleLogout = async () => {
		await logout()
		navigate('/login')
	}

	const handleAvatarClick = () => {
		fileInputRef.current?.click()
	}



	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
  
    // мгновенное превью
    setAvatar(URL.createObjectURL(file))
  
    const formData = new FormData()
    formData.append('photo', file)
  
    try {
      setUploading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/upload-photo/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
      })
  
      if (!response.ok) {
        console.error('Ошибка при загрузке:', await response.text())
        return
      }
  
      // 🔄 ключевое: подтянуть свежего пользователя
      await refreshUser()
  
      // сбросить blob, чтобы показать серверный URL (не обязательно)
      setAvatar(null)
    } catch (err) {
      console.error('Ошибка при загрузке аватарки:', err)
    } finally {
      setUploading(false)
    }
  }
  
	return (
		<div className='min-h-screen bg-gradient-to-b from-sky-50 via-cyan-50 to-sky-100 text-gray-800 relative overflow-hidden'>
			{/* Волны и фон */}
			<div className='absolute inset-0 pointer-events-none'>
				<div className='absolute top-[-50px] left-0 w-full h-56 bg-gradient-to-r from-cyan-600 to-sky-500 rounded-b-[100px] shadow-md' />
				<div className='absolute bottom-10 left-10 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl animate-pulse' />
				<div className='absolute top-1/3 right-0 w-80 h-80 bg-sky-400/10 rounded-full blur-2xl animate-pulse' />
			</div>

			<div className='relative max-w-5xl mx-auto px-6 py-10 z-10'>
				<Card className='p-6 bg-white/70 backdrop-blur-md shadow-lg border border-white/40 rounded-2xl relative overflow-hidden'>
					<div className='relative flex flex-col sm:flex-row sm:items-center gap-6'>
						<div className='relative flex-shrink-0'>
							<div
								className='w-32 h-32 rounded-full bg-gradient-to-br from-cyan-200 to-sky-300 flex items-center justify-center text-cyan-900 text-5xl font-bold border-4 border-white shadow-lg cursor-pointer overflow-hidden'
								onClick={handleAvatarClick}
								title='Изменить фото'
							>
								{avatar || user?.photo ? (
									<img
										src={
											avatar
												? avatar
												: `${import.meta.env.VITE_API_URL}${user?.photo}`
										}
										alt='avatar'
										className='w-full h-full object-cover'
									/>
								) : (
									<User className='w-14 h-14 opacity-70' />
								)}
							</div>

							<button
								onClick={handleAvatarClick}
								className='absolute bottom-1 right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-100 transition'
								title='Загрузить аватар'
							>
								<Camera className='w-4 h-4 text-gray-600' />
							</button>

							<input
								type='file'
								ref={fileInputRef}
								accept='image/*'
								onChange={handleAvatarChange}
								className='hidden'
							/>

							{uploading && (
								<p className='text-xs text-gray-500 mt-1 text-center'>
									Загрузка...
								</p>
							)}
						</div>

						<div className='flex-1'>
							<h1 className='text-3xl font-bold text-gray-800'>
								{user?.username || 'Имя пользователя'}
							</h1>
							<p className='text-gray-500 text-sm'>
								Участник проекта «Карта чистоты Каспия»
							</p>
							<div className='flex flex-wrap gap-4 mt-3 text-sm text-gray-600'>
								<span>📧 {user?.email || 'example@mail.ru'}</span>
								<span>🌍 Регион: Махачкала</span>
							</div>
						</div>

						<Button
							variant='outline'
							className='flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 shadow-sm'
							onClick={handleLogout}
						>
							<LogOut className='w-4 h-4' /> Выйти
						</Button>
					</div>
				</Card>

				{/* Статистика */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-10'>
					{[
						{ label: 'Всего точек', value: 12, color: 'text-cyan-700' },
						{ label: 'Очищено', value: 5, color: 'text-green-600' },
						{ label: 'В работе', value: 3, color: 'text-amber-500' },
					].map((stat, i) => (
						<Card
							key={i}
							className='p-5 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md border border-white/40 rounded-xl text-center transition'
						>
							<div className={`text-4xl font-bold ${stat.color}`}>
								{stat.value}
							</div>
							<div className='text-sm text-gray-600 mt-1'>{stat.label}</div>
						</Card>
					))}
				</div>

				{/* Активность */}
				<div className='mt-10'>
					<h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-cyan-800'>
						<MapIcon className='w-5 h-5 text-cyan-700' /> Мои точки загрязнения
					</h2>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
						{[
							{
								title: 'Бытовой мусор у побережья',
								status: 'новая',
								date: '12.10.2025',
							},
							{
								title: 'Нефтяное пятно в бухте',
								status: 'в работе',
								date: '05.10.2025',
							},
							{
								title: 'Очистка пляжа в Каспийске',
								status: 'очищено',
								date: '01.09.2025',
							},
						].map((p, i) => (
							<Card
								key={i}
								className='p-4 bg-white/80 border border-white/40 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-transform'
							>
								<h3 className='font-semibold text-gray-800 mb-1'>{p.title}</h3>
								<p className='text-sm text-gray-500 mb-2'>Дата: {p.date}</p>
								<span
									className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
										p.status === 'очищено'
											? 'bg-green-100 text-green-700'
											: p.status === 'в работе'
											? 'bg-yellow-100 text-yellow-700'
											: 'bg-red-100 text-red-700'
									}`}
								>
									{p.status}
								</span>
							</Card>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
