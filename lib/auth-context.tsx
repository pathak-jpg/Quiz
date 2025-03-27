"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: User) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on client
    const storedUser = localStorage.getItem("quizlytics-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) return false

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem("quizlytics-user", JSON.stringify(userData))
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (userData: User) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (!response.ok) return false

      const newUser = await response.json()
      setUser(newUser)
      localStorage.setItem("quizlytics-user", JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("quizlytics-user")
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

