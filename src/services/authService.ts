import axios from "axios"
import Cookies from "js-cookie"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

axios.defaults.withCredentials = true // важно!

export interface User {
  id: number
  username: string
  email: string
  role?: "admin" | "volunteer" | "guest"
}

export const authService = {
  async register(username: string, email: string, password: string) {
    await axios.post(`${API_URL}/users/register/`, { username, email, password }, { withCredentials: true })
  },

  async login(username: string, password: string) {
    await axios.post(`${API_URL}/users/login/`, { username, password }, { withCredentials: true })
  },

  async logout() {
	const csrfToken = Cookies.get('csrftoken');
    await axios.post(`${API_URL}/users/logout/`, {}, { withCredentials: true, headers: { 'X-CSRFToken': csrfToken } })
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await axios.get(`${API_URL}/users/me/`, { withCredentials: true })
      return res.data
    } catch {
      return null
    }
  },
}
