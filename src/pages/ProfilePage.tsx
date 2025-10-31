import { PointDetailsSheet } from '@/components/PointDetailsSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import Cookies from 'js-cookie'
import { Camera, LogOut, MapIcon, User, ArrowLeft } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function ProfilePage() {
	const { user, logout, refreshUser } = useAuth()
	const navigate = useNavigate()
	const [avatar, setAvatar] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// состояние выбранной точки
	const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
	const [detailsOpen, setDetailsOpen] = useState(false)

	// выход
	const handleLogout = async () => {
		await logout()
		navigate('/login')
	}

	// кнопка "назад"
	const handleGoBack = () => {
		if (window.history.length > 1) {
			navigate(-1)
		} else {
			navigate('/map')
		}
	}

	// загрузка аватарки
	const handleAvatarClick = () => fileInputRef.current?.click()

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setAvatar(URL.createObjectURL(file))

		const formData = new FormData()
		formData.append('photo', file)

		try {
			setUploading(true)
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/users/upload-photo/`,
				{
					method: 'POST',
					body: formData,
					credentials: 'include',
					headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
				}
			)
			if (!response.ok) throw new Error(await response.text())
			await refreshUser()
			setAvatar(null)
			toast.success('Аватар обновлён')
		} catch (err) {
			console.error('Ошибка при загрузке аватарки:', err)
			toast.error('Не удалось загрузить фото')
		} finally {
			setUploading(false)
		}
	}

	// статистика
	const stats = useMemo(() => {
		const reports = user?.pollution_reports || []
		return {
			total: reports.length,
			cleaned: reports.filter(r => r.status === 'cleaned').length,
			inProgress: reports.filter(r => r.status === 'in_progress').length,
			new: reports.filter(r => r.status === 'new').length,
		}
	}, [user])

	// открытие деталей
	const handlePointClick = (point: any) => {
		setSelectedPoint(point)
		setDetailsOpen(true)
	}

	// мгновенное обновление статуса
	const handleStatusChange = async (id: string, status: string) => {
		try {
			if (user?.pollution_reports) {
				const updatedReports = user.pollution_reports.map(p =>
					p.id === id ? { ...p, status } : p
				)
				user.pollution_reports = updatedReports
			}

			if (selectedPoint && selectedPoint.id === id) {
				setSelectedPoint({ ...selectedPoint, status })
			}

			const res = await fetch(
				`${import.meta.env.VITE_API_URL}/pollutions/points/${id}/set-status/`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': Cookies.get('csrftoken') || '',
					},
					credentials: 'include',
					body: JSON.stringify({ status }),
				}
			)

			if (!res.ok) throw new Error()
			toast.success('Статус успешно обновлён')
			await refreshUser()
		} catch (e) {
			console.error('Ошибка при изменении статуса', e)
			toast.error('Ошибка при смене статуса')
		}
	}

	return (
		<div className="min-h-screen relative bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 text-gray-800 overflow-hidden">
			{/* 🌤 Фон с лёгким паттерном */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15)_0%,transparent_60%)]" />
			<div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'><rect width=\\'60\\' height=\\'60\\' fill=\\'none\\' stroke=\\'%23dbeafe\\' stroke-width=\\'0.5\\'/></svg>')] opacity-20" />

			{/* Контент */}
			<div className="relative max-w-5xl mx-auto px-6 py-10 z-10">
				{/* 🔙 Кнопка Назад */}
				<div className="mb-6">
					<Button
						variant="ghost"
						className="flex items-center gap-2 text-cyan-700 hover:bg-cyan-50"
						onClick={handleGoBack}
					>
						<ArrowLeft className="w-4 h-4" /> Назад
					</Button>
				</div>

				{/* Карточка профиля */}
				<Card className="p-6 bg-white/80 backdrop-blur-md shadow-lg border border-white/40 rounded-2xl">
					<div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
						{/* Фото */}
						<div className="relative flex-shrink-0">
							<div
								className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-200 to-sky-300 flex items-center justify-center text-cyan-900 text-5xl font-bold border-4 border-white shadow-md cursor-pointer overflow-hidden"
								onClick={handleAvatarClick}
							>
								{avatar || user?.photo ? (
									<img
										src={
											user?.photo?.startsWith('http')
												? user.photo
												: `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.photo}`
										}
										alt="avatar"
										className="w-full h-full object-cover"
										crossOrigin="anonymous"
									/>
								) : (
									<User className="w-14 h-14 opacity-70" />
								)}
							</div>

							<button
								onClick={handleAvatarClick}
								className="absolute bottom-1 right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-100 transition"
							>
								<Camera className="w-4 h-4 text-gray-600" />
							</button>

							<input
								type="file"
								ref={fileInputRef}
								accept="image/*"
								onChange={handleAvatarChange}
								className="hidden"
							/>
							{uploading && (
								<p className="text-xs text-gray-500 mt-1 text-center">Загрузка...</p>
							)}
						</div>

						{/* Информация */}
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-800">
								{user?.username || 'Имя пользователя'}
							</h1>
							<p className="text-gray-500 text-sm">
								{user?.role === 'organization' ? 'Организация' : 'Житель Каспия'}
							</p>
							<div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
								<span>📧 {user?.email}</span>
								<span>🆔 ID: {user?.id}</span>
							</div>
						</div>

						<Button
							variant="outline"
							className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 shadow-sm"
							onClick={handleLogout}
						>
							<LogOut className="w-4 h-4" /> Выйти
						</Button>
					</div>
				</Card>

				{/* Статистика */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
					{[
						{ label: 'Всего точек', value: stats.total, color: 'text-cyan-700' },
						{ label: 'Очищено', value: stats.cleaned, color: 'text-green-600' },
						{ label: 'В работе', value: stats.inProgress, color: 'text-amber-500' },
					].map((stat, i) => (
						<Card
							key={i}
							className="p-5 bg-white/70 backdrop-blur-sm hover:shadow-md border border-white/40 rounded-xl text-center transition"
						>
							<div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
							<div className="text-sm text-gray-600 mt-1">{stat.label}</div>
						</Card>
					))}
				</div>

				{/* Список точек */}
				<div className="mt-10">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-cyan-800">
						<MapIcon className="w-5 h-5 text-cyan-700" /> Мои точки
					</h2>

					{user?.pollution_reports?.length ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
							{user.pollution_reports.map((p, i) => (
								<Card
									key={i}
									onClick={() => handlePointClick(p)}
									className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-transform cursor-pointer"
								>
									<h3 className="font-semibold text-gray-800 mb-1">
										{p.title || 'Без названия'}
									</h3>
									<p className="text-sm text-gray-500 mb-2">
										{p.created_at
											? `Дата: ${new Date(p.created_at).toLocaleDateString()}`
											: ''}
									</p>
									<span
										className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
											p.status === 'cleaned'
												? 'bg-green-100 text-green-700'
												: p.status === 'in_progress'
												? 'bg-yellow-100 text-yellow-700'
												: 'bg-red-100 text-red-700'
										}`}
									>
										{{
											cleaned: 'Очищено',
											in_progress: 'В работе',
											new: 'Новая',
										}[p.status] || 'Неизвестно'}
									</span>
								</Card>
							))}
						</div>
					) : (
						<p className="text-gray-500 italic">У вас пока нет добавленных точек 🌊</p>
					)}
				</div>
			</div>

			{/* Детали точки */}
			<PointDetailsSheet
				point={selectedPoint}
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				onStatusChange={handleStatusChange}
				isAdmin={user?.role === 'moderator' || user?.role === 'admin'}
			/>
		</div>
	)
}