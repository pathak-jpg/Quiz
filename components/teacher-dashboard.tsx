"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Quiz, QuizDifficulty } from "@/lib/types"

export default function TeacherDashboard() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [totalTimeLimit, setTotalTimeLimit] = useState(30)
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [quizCode, setQuizCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setQuizCode("")
    setIsLoading(true)

    try {
      if (!user) {
        setError("You must be logged in to create a quiz")
        return
      }

      const quizData: Quiz = {
        title,
        description,
        teacherEmail: user.email,
        totalTimeLimit: totalTimeLimit * 60, // Convert to seconds
        difficulty,
        createdAt: Date.now(),
      }

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create quiz")
      }

      const data = await response.json()
      setQuizCode(data.quizCode)
      setSuccess("Quiz created successfully! Now add questions to your quiz.")

      // Clear form
      setTitle("")
      setDescription("")
      setTotalTimeLimit(30)
      setDifficulty("medium")

      // Redirect to add questions
      router.push(`/dashboard/add-questions/${data.quizCode}`)
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the quiz")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create a New Quiz</h1>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>
            Fill in the details for your new quiz. You'll be able to add questions after creating the quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {quizCode && (
              <Alert className="bg-purple-50 text-purple-800 border-purple-200">
                <div className="flex flex-col">
                  <AlertDescription className="text-purple-800 font-bold">Quiz Code: {quizCode}</AlertDescription>
                  <AlertDescription className="text-purple-800 text-sm">
                    Share this code with your students to allow them to take the quiz.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Midterm Review"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief description of the quiz"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  max={180}
                  value={totalTimeLimit}
                  onChange={(e) => setTotalTimeLimit(Number.parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as QuizDifficulty)}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? "Creating Quiz..." : "Create Quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

