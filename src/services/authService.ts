import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface User {
	id: number
	username: string
	email: string
	role: "admin" | "volunteer" | "guest"
}

export interface AuthResponse {
	access: string
	refresh: string
}

export const authService = {
	async register(username: string, email: string, password: string) {
		const res = await axios.post(`${API_URL}/register/`, {
			username,
			email,
			password,
		})
		return res.data
	},

	async login(username: string, password: string): Promise<AuthResponse> {
		const res = await axios.post(`${API_URL}/login/`, {
			username,
			password,
		})
		localStorage.setItem("access", res.data.access)
		localStorage.setItem("refresh", res.data.refresh)
		return res.data
	},

	async logout() {
		try {
			await axios.post(`${API_URL}/logout/`)
		} finally {
			localStorage.removeItem("access")
			localStorage.removeItem("refresh")
			localStorage.removeItem("user")
		}
	},

	async getCurrentUser(): Promise<User | null> {
		const token = localStorage.getItem("access")
		if (!token) return null

		try {
			const res = await axios.get(`${API_URL}/me/`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			localStorage.setItem("user", JSON.stringify(res.data))
			return res.data
		} catch (e) {
			return null
		}
	},
}
