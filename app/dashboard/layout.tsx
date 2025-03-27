"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-purple-800">
            Quizlytics
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, <span className="font-medium">{user.name}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-2">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              {user.role === "teacher" ? (
                <>
                  <TabsTrigger value="dashboard" asChild>
                    <Link href="/dashboard">Quiz Creation</Link>
                  </TabsTrigger>
                  <TabsTrigger value="previous-quizzes" asChild>
                    <Link href="/dashboard/previous-quizzes">Previous Quizzes</Link>
                  </TabsTrigger>
                  <TabsTrigger value="performance" asChild>
                    <Link href="/dashboard/performance">Performance</Link>
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="dashboard" asChild>
                    <Link href="/dashboard">Attempt Quiz</Link>
                  </TabsTrigger>
                  <TabsTrigger value="results" asChild>
                    <Link href="/dashboard/results">Results</Link>
                  </TabsTrigger>
                  <TabsTrigger value="history" asChild>
                    <Link href="/dashboard/history">History</Link>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

