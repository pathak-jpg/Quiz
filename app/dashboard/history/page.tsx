"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, BarChart3, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { QuizAttempt, Quiz } from "@/lib/types"

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch student's attempts
        const attemptsResponse = await fetch(`/api/attempts?studentEmail=${user.email}`)

        if (!attemptsResponse.ok) {
          throw new Error("Failed to fetch attempts")
        }

        const attemptsData = await attemptsResponse.json()
        setAttempts(attemptsData)

        // Fetch quiz details for each attempt
        const quizzesMap: Record<string, Quiz> = {}

        for (const attempt of attemptsData) {
          if (!quizzesMap[attempt.quizCode]) {
            const quizResponse = await fetch(`/api/quizzes/${attempt.quizCode}`)

            if (quizResponse.ok) {
              const quizData = await quizResponse.json()
              quizzesMap[attempt.quizCode] = quizData.quiz
            }
          }
        }

        setQuizzes(quizzesMap)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
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

  if (attempts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz History</h1>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">You haven't attempted any quizzes yet.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group attempts by quiz code
  const attemptsByQuiz: Record<string, QuizAttempt[]> = {}

  attempts.forEach((attempt) => {
    if (!attemptsByQuiz[attempt.quizCode]) {
      attemptsByQuiz[attempt.quizCode] = []
    }
    attemptsByQuiz[attempt.quizCode].push(attempt)
  })

  // Sort attempts by date
  Object.values(attemptsByQuiz).forEach((quizAttempts) => {
    quizAttempts.sort((a, b) => b.startTime - a.startTime)
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz History</h1>

      <div className="grid gap-8">
        {Object.entries(attemptsByQuiz).map(([quizCode, quizAttempts]) => {
          const quiz = quizzes[quizCode]

          // Calculate average score
          const avgScore =
            quizAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.maxScore) * 100, 0) /
            quizAttempts.length

          // Calculate best score
          const bestScore = Math.max(...quizAttempts.map((attempt) => (attempt.score / attempt.maxScore) * 100))

          return (
            <Card key={quizCode}>
              <CardHeader>
                <CardTitle>{quiz?.title || `Quiz ${quizCode}`}</CardTitle>
                <CardDescription>
                  {quizAttempts.length} attempt{quizAttempts.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Average Score</div>
                    <div className="text-2xl font-bold text-purple-600">{avgScore.toFixed(1)}%</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Best Score</div>
                    <div className="text-2xl font-bold text-green-600">{bestScore.toFixed(1)}%</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Last Attempt</div>
                    <div className="text-lg font-medium">{formatDate(quizAttempts[0].startTime)}</div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizAttempts.map((attempt, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(attempt.startTime)}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              (attempt.score / attempt.maxScore) >= 0.7
                                ? "text-green-600"
                                : attempt.score / attempt.maxScore >= 0.4
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {attempt.score}/{attempt.maxScore} ({((attempt.score / attempt.maxScore) * 100).toFixed(0)}
                            %)
                          </span>
                        </TableCell>
                        <TableCell>{formatDuration(attempt.totalTimeSpent)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {attempt.efficiencyScore.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    Performance trend:{" "}
                    {quizAttempts.length > 1
                      ? quizAttempts[0].score > quizAttempts[1].score
                        ? "Improving"
                        : quizAttempts[0].score < quizAttempts[1].score
                          ? "Declining"
                          : "Stable"
                      : "Not enough data"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

