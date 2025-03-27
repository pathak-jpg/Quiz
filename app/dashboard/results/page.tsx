"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { QuizAttempt, Quiz } from "@/lib/types"
import { generatePDF } from "@/lib/pdf-generator"
import Link from "next/link"

export default function ResultsPage() {
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
        setError("Failed to load results. Please try again.")
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

  const handleDownloadPDF = async (attempt: QuizAttempt) => {
    try {
      const quizResponse = await fetch(`/api/quizzes/${attempt.quizCode}`)

      if (!quizResponse.ok) {
        throw new Error("Failed to fetch quiz details")
      }

      const quizData = await quizResponse.json()

      generatePDF(user?.name || "Student", user?.email || "", quizData.quiz, quizData.questions, {
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: (attempt.score / attempt.maxScore) * 100,
        timeAnalysis: {
          totalTime: attempt.totalTimeSpent,
          averageTimePerQuestion: attempt.totalTimeSpent / attempt.questionAttempts.length,
          timePerQuestion: attempt.questionAttempts.map((q) => q.timeSpent),
        },
        optionSwitchCount: attempt.questionAttempts.reduce((sum, q) => sum + q.optionSwitches, 0),
        skippedCount: attempt.skippedCount,
        hardQuestionsAccuracy: 0, // This would need to be calculated
        efficiencyScore: attempt.efficiencyScore,
        attemptSequence: attempt.questionAttempts.map((q) => q.questionIndex),
        feedback: "Performance analysis report for your quiz attempt.", // This would need to be generated
      })
    } catch (err) {
      console.error("Error generating PDF:", err)
      setError("Failed to generate PDF. Please try again.")
    }
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz Results</h1>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">You haven't attempted any quizzes yet.</p>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-700">Attempt a Quiz</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz Results</h1>

      <div className="grid gap-6">
        {attempts.map((attempt, index) => {
          const quiz = quizzes[attempt.quizCode]

          return (
            <Card key={index}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{quiz?.title || `Quiz ${attempt.quizCode}`}</CardTitle>
                    <CardDescription className="mt-1">Attempted on {formatDate(attempt.startTime)}</CardDescription>
                  </div>
                  <Badge
                    className={`
                    ${
                      (attempt.score / attempt.maxScore) >= 0.7
                        ? "bg-green-500"
                        : attempt.score / attempt.maxScore >= 0.4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }
                  `}
                  >
                    {((attempt.score / attempt.maxScore) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500 mb-1">Score</div>
                    <div className="font-medium">
                      {attempt.score}/{attempt.maxScore}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500 mb-1">Time Spent</div>
                    <div className="font-medium">{formatDuration(attempt.totalTimeSpent)}</div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-500 mb-1">Efficiency Score</div>
                    <div className="font-medium">{attempt.efficiencyScore.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span>Skipped: {attempt.skippedCount} questions</span>
                  </div>
                  <div className="flex items-center">
                    <span>
                      Option Switches: {attempt.questionAttempts.reduce((sum, q) => sum + q.optionSwitches, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-gray-50 pt-4 pb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Quiz Code: {attempt.quizCode}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(attempt)}>
                  <Download className="mr-1 h-4 w-4" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

