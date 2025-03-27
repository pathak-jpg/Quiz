"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StudentDashboard() {
  const [quizCode, setQuizCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!user) {
        setError("You must be logged in to attempt a quiz")
        return
      }

      // Check if the quiz exists
      const response = await fetch(`/api/quizzes/${quizCode}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Quiz not found. Please check the code and try again.")
        }
        throw new Error("Failed to verify quiz code")
      }

      // Redirect to the quiz page
      router.push(`/dashboard/attempt-quiz/${quizCode}`)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Attempt a Quiz</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enter Quiz Code</CardTitle>
          <CardDescription>Enter the quiz code provided by your teacher to start the quiz.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="quizCode">Quiz Code</Label>
              <Input
                id="quizCode"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code (e.g., ABC123)"
                className="text-center text-lg tracking-wider uppercase"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading || quizCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Start Quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quiz Instructions</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 h-6 w-6 mr-3 flex-shrink-0 text-sm">
                  1
                </span>
                <span>Enter the 6-character quiz code provided by your teacher.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 h-6 w-6 mr-3 flex-shrink-0 text-sm">
                  2
                </span>
                <span>Each quiz has a total time limit. Make sure you complete all questions within the time.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 h-6 w-6 mr-3 flex-shrink-0 text-sm">
                  3
                </span>
                <span>Each question may have its own time limit. Pay attention to the timer.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 h-6 w-6 mr-3 flex-shrink-0 text-sm">
                  4
                </span>
                <span>You can skip questions and come back to them later if time permits.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-600 h-6 w-6 mr-3 flex-shrink-0 text-sm">
                  5
                </span>
                <span>After completing the quiz, you'll receive detailed performance analysis.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

