"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, Copy, Eye, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Quiz } from "@/lib/types"
import Link from "next/link"

export default function PreviousQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/quizzes?teacherEmail=${user.email}`)

        if (!response.ok) {
          throw new Error("Failed to fetch quizzes")
        }

        const data = await response.json()
        setQuizzes(data)
      } catch (err) {
        console.error("Error fetching quizzes:", err)
        setError("Failed to load quizzes. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizzes()
  }, [user])

  const copyQuizCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)

    // Reset copied state after 3 seconds
    setTimeout(() => setCopiedCode(null), 3000)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Previous Quizzes</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any quizzes yet.</p>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-700">Create Your First Quiz</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Previous Quizzes</h1>

      <div className="grid gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.code} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription className="mt-1">{quiz.description}</CardDescription>
                </div>
                <Badge
                  className={`
                  ${quiz.difficulty === "easy" ? "bg-green-500" : ""}
                  ${quiz.difficulty === "medium" ? "bg-yellow-500" : ""}
                  ${quiz.difficulty === "hard" ? "bg-red-500" : ""}
                `}
                >
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{Math.floor(Number(quiz.totalTimeLimit) / 60)} minutes</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span>0 attempts</span>
                </div>
                <div className="flex items-center">
                  <span>Created: {formatDate(Number(quiz.createdAt))}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 pt-4 pb-4">
              <div className="flex items-center">
                <span className="font-medium mr-2">Quiz Code:</span>
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">{quiz.code}</code>
                <Button variant="ghost" size="icon" onClick={() => copyQuizCode(quiz.code as string)} className="ml-1">
                  {copiedCode === quiz.code ? (
                    <span className="text-green-600 text-xs">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/performance?quizCode=${quiz.code}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" />
                    View Results
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

