"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle, BarChart3, Clock, Download, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Quiz, QuizAttempt } from "@/lib/types"

export default function PerformancePage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const quizCode = searchParams.get("quizCode")

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // If a specific quiz code is provided, fetch that quiz
        if (quizCode) {
          const quizResponse = await fetch(`/api/quizzes/${quizCode}`)

          if (!quizResponse.ok) {
            throw new Error("Failed to fetch quiz")
          }

          const quizData = await quizResponse.json()
          setQuiz(quizData.quiz)

          // Fetch attempts for this quiz
          const attemptsResponse = await fetch(`/api/attempts?quizCode=${quizCode}`)

          if (!attemptsResponse.ok) {
            throw new Error("Failed to fetch attempts")
          }

          const attemptsData = await attemptsResponse.json()
          setAttempts(attemptsData)
        } else {
          // Fetch all quizzes by this teacher
          const quizzesResponse = await fetch(`/api/quizzes?teacherEmail=${user.email}`)

          if (!quizzesResponse.ok) {
            throw new Error("Failed to fetch quizzes")
          }

          const quizzes = await quizzesResponse.json()

          // Fetch attempts for all quizzes
          const allAttempts: QuizAttempt[] = []

          for (const quiz of quizzes) {
            const attemptsResponse = await fetch(`/api/attempts?quizCode=${quiz.code}`)

            if (attemptsResponse.ok) {
              const attemptsData = await attemptsResponse.json()
              allAttempts.push(...attemptsData)
            }
          }

          setAttempts(allAttempts)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load performance data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, quizCode])

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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {quiz ? `Performance: ${quiz.title}` : "Performance Analysis"}
        </h1>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No quiz attempts found.</p>
            {!quizCode && (
              <p className="text-gray-500">Once students start taking your quizzes, their results will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {quiz ? `Performance: ${quiz.title}` : "Performance Analysis"}
      </h1>

      {quiz && (
        <Card className="mb-8">
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
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{Math.floor(Number(quiz.totalTimeLimit) / 60)} minutes</span>
              </div>
              <div className="flex items-center">
                <User className="mr-1 h-4 w-4" />
                <span>{attempts.length} attempts</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="mr-1 h-4 w-4" />
                <span>
                  Avg. Score:{" "}
                  {(
                    attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.maxScore) * 100, 0) /
                    attempts.length
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            Detailed performance of all students who have attempted {quiz ? "this quiz" : "your quizzes"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {!quiz && <TableHead>Quiz</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{attempt.studentEmail}</TableCell>
                  {!quiz && <TableCell>{attempt.quizCode}</TableCell>}
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
                      {attempt.score}/{attempt.maxScore} ({((attempt.score / attempt.maxScore) * 100).toFixed(0)}%)
                    </span>
                  </TableCell>
                  <TableCell>{formatDuration(attempt.totalTimeSpent)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      {attempt.efficiencyScore.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

