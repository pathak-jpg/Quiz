"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Question, Quiz, QuizDifficulty } from "@/lib/types"

export default function AddQuestionsPage({ params }: { params: { code: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    timeLimit: 60,
    difficulty: "medium",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const quizCode = params.code

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/quizzes/${quizCode}`)

        if (!response.ok) {
          throw new Error("Failed to fetch quiz")
        }

        const data = await response.json()
        setQuiz(data.quiz)

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
        }
      } catch (err) {
        console.error("Error fetching quiz:", err)
        setError("Failed to load quiz. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (quizCode) {
      fetchQuiz()
    }
  }, [quizCode])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index] = value
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setError("Question text is required")
      return
    }

    if (currentQuestion.options.some((option) => !option.trim())) {
      setError("All options must be filled")
      return
    }

    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      timeLimit: 60,
      difficulty: "medium",
    })
    setError("")
    setSuccess("Question added successfully")

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000)
  }

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions]
    newQuestions.splice(index, 1)
    setQuestions(newQuestions)
  }

  const saveQuestions = async () => {
    if (questions.length === 0) {
      setError("Add at least one question before saving")
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/quizzes/${quizCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save questions")
      }

      setSuccess("Questions saved successfully!")

      // Redirect to previous quizzes page after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/previous-quizzes")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred while saving questions")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Quiz not found. Please check the quiz code and try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Questions</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-purple-600">Quiz Code: {quizCode}</span>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add a New Question</CardTitle>
          <CardDescription>Fill in the question details and options. Mark the correct answer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text</Label>
            <Input
              id="questionText"
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
              placeholder="Enter your question here"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={10}
                max={300}
                value={currentQuestion.timeLimit}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: Number.parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={currentQuestion.difficulty}
                onValueChange={(value) =>
                  setCurrentQuestion({ ...currentQuestion, difficulty: value as QuizDifficulty })
                }
              >
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

          <div className="space-y-4">
            <Label>Options</Label>
            <RadioGroup
              value={currentQuestion.correctOptionIndex.toString()}
              onValueChange={(value) =>
                setCurrentQuestion({ ...currentQuestion, correctOptionIndex: Number.parseInt(value) })
              }
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <div className="flex-1">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                  <Label htmlFor={`option-${index}`} className="text-sm font-medium">
                    {index === currentQuestion.correctOptionIndex ? "Correct" : ""}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button type="button" onClick={addQuestion} className="w-full bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Added Questions ({questions.length})</CardTitle>
            <CardDescription>
              Review your questions before saving. You can remove any question if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="border p-4 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mb-2">{question.text}</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded-md text-sm ${
                        optIndex === question.correctOptionIndex
                          ? "bg-green-100 border-green-300 border"
                          : "bg-gray-100"
                      }`}
                    >
                      {option}
                      {optIndex === question.correctOptionIndex && (
                        <span className="ml-2 text-green-600 text-xs font-medium">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Time: {question.timeLimit} seconds</span>
                  <span>Difficulty: {question.difficulty}</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={saveQuestions} className="w-full bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving ? "Saving Questions..." : "Save All Questions"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

