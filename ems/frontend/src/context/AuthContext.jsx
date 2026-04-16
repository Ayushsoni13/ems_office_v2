import { createContext, useContext, useState } from 'react'
import api from '../utils/api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ems_user')) } catch { return null }
  })

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('ems_token', data.access_token)
    localStorage.setItem('ems_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    localStorage.setItem('ems_user', JSON.stringify(updated))
    setUser(updated)
  }

  return <Ctx.Provider value={{ user, login, logout, updateUser }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
