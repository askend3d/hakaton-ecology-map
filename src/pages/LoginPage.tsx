import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BgImage from '../../public/caspian-shore.jpg'

const LoginPage: React.FC = () => {
	const { login } = useAuth()
	const navigate = useNavigate()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			await login(username, password)
			navigate('/')
		} catch {
			setError('Неверное имя пользователя или пароль')
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
					Вход
				</h2>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
				
					
						<input
							type='text'
							placeholder='Имя пользователя'
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={username}
							onChange={e => setUsername(e.target.value)}
							required
						/>
					</div>
					<div>
						<input
							type='password'
							placeholder='Пароль'
							className='w-full p-2 border border-gray-300 rounded input-field'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>
					{error && <p className='text-red-500 text-sm'>{error}</p>}
					<Button
						type='submit'
						className='w-full button-green'
						disabled={loading}
					>
						{loading ? 'Вход...' : 'Войти'}
					</Button>
				</form>
				<p className='mt-4 text-sm text-center text-gray-700'>
					Нет аккаунта?{' '}
					<Link to='/register' className='text-link'>
						Зарегистрироваться
					</Link>
				</p>
			</div>
		</div>
	)
}

export default LoginPage
