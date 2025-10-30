import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BgImage from '../../public/caspian-shore.jpg'

const RegisterPage: React.FC = () => {
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
			setError('Ошибка при регистрации. Проверьте данные.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className='min-h-screen flex items-center justify-center'
			style={{
				background: `linear-gradient(to bottom, rgba(160, 233, 255, 0.8), rgba(255,255,255,0.8)), url(${BgImage})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			<div
				className='w-full max-w-md card-blur backdrop-blur-lg  p-6'
				style={{ borderRadius: 10, border: '2px solid black' }}
			>
				<h2
					className='text-3xl font-bold mb-6 text-center'
					style={{
						color: '#10b5cb',
					}}
				>
					Регистрация
				</h2>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<input
							type='text'
							placeholder='Имя пользователя'
							style={{ borderRadius: 10 }}
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={username}
							onChange={e => setUsername(e.target.value)}
							required
						/>
					</div>
					<div>
						<input
							type='email'
							placeholder='Email'
							style={{ borderRadius: 10 }}
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div>
						<input
							type='password'
							placeholder='Пароль'
							style={{ borderRadius: 10 }}
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>
					
					<div>
						<input
							type='password'
							placeholder='Повторите пароль'
							style={{ borderRadius: 10 }}
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={confirmPassword}
							onChange={e => setConfirmPassword(e.target.value)}
							required
						/>
					</div>
					{error && <p className='text-red-500 text-sm'>{error}</p>}
					<Button
						type='submit'
						className='w-full button-green'
						disabled={loading}
					>
						{loading ? 'Регистрация...' : 'Зарегистрироваться'}
					</Button>
				</form>
				<p className='mt-4 text-sm text-center text-gray-700'>
					Уже есть аккаунт?{' '}
					<Link to='/login' className='text-link'>
						Войти
					</Link>
				</p>
			</div>
		</div>
	)
}

export default RegisterPage
