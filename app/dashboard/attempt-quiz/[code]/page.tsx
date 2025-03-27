"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, SkipForward } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Quiz, Question, QuestionAttempt, QuizAttempt } from "@/lib/types"
import { calculatePerformanceAnalysis } from "@/lib/analysis"

export default function AttemptQuizPage({ params }: { params: { code: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [optionSwitches, setOptionSwitches] = useState(0)
  const [questionAttempts, setQuestionAttempts] = useState<QuestionAttempt[]>([])
  const [quizStartTime, setQuizStartTime] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [questionRemainingTime, setQuestionRemainingTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()
  const quizCode = params.code
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null)

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
        setQuestions(data.questions)

        // Initialize quiz timer
        const startTime = Date.now()
        setQuizStartTime(startTime)
        setRemainingTime(Number(data.quiz.totalTimeLimit))

        // Initialize question timer
        setQuestionStartTime(startTime)
        setQuestionRemainingTime(data.questions[0].timeLimit)
      } catch (err) {
        console.error("Error fetching quiz:", err)
        setError("Failed to load quiz. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    }
  }, [quizCode])

  useEffect(() => {
    if (!quiz || quizCompleted) return

    // Set up quiz timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - quizStartTime) / 1000)
      const remaining = Math.max(0, Number(quiz.totalTimeLimit) - elapsed)
      setRemainingTime(remaining)

      if (remaining === 0) {
        completeQuiz()
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [quiz, quizStartTime, quizCompleted])

  useEffect(() => {
    if (!questions.length || quizCompleted) return

    // Set up question timer
    const currentQuestion = questions[currentQuestionIndex]
    setQuestionRemainingTime(currentQuestion.timeLimit)
    setQuestionStartTime(Date.now())

    questionTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000)
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed)
      setQuestionRemainingTime(remaining)

      if (remaining === 0) {
        moveToNextQuestion()
      }
    }, 1000)

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    }
  }, [currentQuestionIndex, questions, quizCompleted])

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null && selectedOption !== optionIndex) {
      setOptionSwitches((prev) => prev + 1)
    }
    setSelectedOption(optionIndex)
  }

  const recordQuestionAttempt = () => {
    const timeSpent = Math.min(
      questions[currentQuestionIndex].timeLimit,
      Math.floor((Date.now() - questionStartTime) / 1000),
    )

    const attempt: QuestionAttempt = {
      questionIndex: currentQuestionIndex,
      selectedOptionIndex: selectedOption,
      timeSpent,
      optionSwitches,
      skipped: selectedOption === null,
    }

    setQuestionAttempts((prev) => {
      // Check if we already have an attempt for this question
      const existingIndex = prev.findIndex((a) => a.questionIndex === currentQuestionIndex)

      if (existingIndex >= 0) {
        // Update existing attempt
        const newAttempts = [...prev]
        newAttempts[existingIndex] = attempt
        return newAttempts
      } else {
        // Add new attempt
        return [...prev, attempt]
      }
    })

    // Reset for next question
    setSelectedOption(null)
    setOptionSwitches(0)
  }

  const moveToNextQuestion = () => {
    // Record current question attempt
    recordQuestionAttempt()

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      // Complete the quiz
      completeQuiz()
    }
  }

  const skipQuestion = () => {
    // Record skipped question
    const timeSpent = Math.min(
      questions[currentQuestionIndex].timeLimit,
      Math.floor((Date.now() - questionStartTime) / 1000),
    )

    const attempt: QuestionAttempt = {
      questionIndex: currentQuestionIndex,
      selectedOptionIndex: null,
      timeSpent,
      optionSwitches,
      skipped: true,
    }

    setQuestionAttempts((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionIndex === currentQuestionIndex)

      if (existingIndex >= 0) {
        const newAttempts = [...prev]
        newAttempts[existingIndex] = attempt
        return newAttempts
      } else {
        return [...prev, attempt]
      }
    })

    // Reset for next question
    setSelectedOption(null)
    setOptionSwitches(0)

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      // Complete the quiz
      completeQuiz()
    }
  }

  const completeQuiz = async () => {
    if (quizCompleted) return

    // Record current question if not already recorded
    if (!questionAttempts.some((a) => a.questionIndex === currentQuestionIndex)) {
      recordQuestionAttempt()
    }

    // Stop timers
    if (timerRef.current) clearInterval(timerRef.current)
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)

    // Calculate total time spent
    const totalTimeSpent = Math.min(Number(quiz?.totalTimeLimit), Math.floor((Date.now() - quizStartTime) / 1000))

    // Calculate score
    let score = 0
    questionAttempts.forEach((attempt) => {
      if (
        attempt.selectedOptionIndex !== null &&
        attempt.selectedOptionIndex === questions[attempt.questionIndex].correctOptionIndex
      ) {
        score++
      }
    })

    // Calculate skipped count
    const skippedCount = questionAttempts.filter((a) => a.skipped).length

    // Calculate efficiency score
    const efficiencyScore = score / (totalTimeSpent / 60) // Score per minute

    // Create quiz attempt object
    const quizAttempt: QuizAttempt = {
      quizCode,
      studentEmail: user?.email || "",
      startTime: quizStartTime,
      endTime: Date.now(),
      totalTimeSpent,
      questionAttempts,
      score,
      maxScore: questions.length,
      skippedCount,
      efficiencyScore,
    }

    try {
      // Save attempt to database
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizAttempt),
      })

      if (!response.ok) {
        throw new Error("Failed to save quiz attempt")
      }

      // Calculate performance analysis
      const performanceAnalysis = calculatePerformanceAnalysis(questions, questionAttempts, totalTimeSpent)

      setAnalysis(performanceAnalysis)
      setQuizCompleted(true)
    } catch (err) {
      console.error("Error completing quiz:", err)
      setError("Failed to save quiz results. Please try again.")
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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

  if (!quiz || questions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Quiz not found or has no questions.</AlertDescription>
      </Alert>
    )
  }

  if (quizCompleted && analysis) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz Results</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quiz Completed: {quiz.title}</CardTitle>
            <CardDescription>You've completed the quiz. Here are your results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Score</div>
                <div className="text-2xl font-bold">
                  {analysis.score}/{analysis.maxScore}
                </div>
                <div className="text-sm font-medium text-purple-600">{analysis.percentage.toFixed(1)}%</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Time Spent</div>
                <div className="text-2xl font-bold">{formatTime(analysis.timeAnalysis.totalTime)}</div>
                <div className="text-sm font-medium text-purple-600">
                  {Math.floor(analysis.timeAnalysis.totalTime / 60)}m {analysis.timeAnalysis.totalTime % 60}s
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Efficiency Score</div>
                <div className="text-2xl font-bold">{analysis.efficiencyScore.toFixed(2)}</div>
                <div className="text-sm font-medium text-purple-600">points/minute</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Analysis</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-3 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Average Time per Question</div>
                  <div className="font-medium">{analysis.timeAnalysis.averageTimePerQuestion.toFixed(1)} seconds</div>
                </div>

                <div className="border p-3 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Option Switching</div>
                  <div className="font-medium">{analysis.optionSwitchCount} times</div>
                </div>

                <div className="border p-3 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Skipped Questions</div>
                  <div className="font-medium">{analysis.skippedCount} questions</div>
                </div>

                <div className="border p-3 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Hard Questions Accuracy</div>
                  <div className="font-medium">{analysis.hardQuestionsAccuracy.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-lg font-semibold mb-2 text-purple-800">Feedback</h3>
              <p className="text-purple-900">{analysis.feedback}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/dashboard/results")}>
              View Detailed Results
            </Button>
            <Button onClick={() => router.push("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <span className="font-medium">{formatTime(remainingTime)}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>Time remaining: {formatTime(questionRemainingTime)}</span>
        </div>
        <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
            <Badge
              className={`
              ${currentQuestion.difficulty === "easy" ? "bg-green-500" : ""}
              ${currentQuestion.difficulty === "medium" ? "bg-yellow-500" : ""}
              ${currentQuestion.difficulty === "hard" ? "bg-red-500" : ""}
            `}
            >
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-md border cursor-pointer transition-colors
                ${selectedOption === index ? "bg-purple-50 border-purple-300" : "hover:bg-gray-50 border-gray-200"}
              `}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="flex items-center">
                <div
                  className={`
                  w-6 h-6 rounded-full flex items-center justify-center mr-3
                  ${selectedOption === index ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}
                `}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={skipQuestion} className="flex items-center">
            <SkipForward className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button onClick={moveToNextQuestion} className="bg-purple-600 hover:bg-purple-700">
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

