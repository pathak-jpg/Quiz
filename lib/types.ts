// User types
export type UserRole = "teacher" | "student"

export interface User {
  email: string
  name: string
  password: string // In a real app, this would be hashed
  role: UserRole
}

// Quiz types
export type QuizDifficulty = "easy" | "medium" | "hard"

export interface Quiz {
  title: string
  description: string
  teacherEmail: string
  totalTimeLimit: number // in seconds
  difficulty: QuizDifficulty
  createdAt: number
  code?: string
  questionCount?: number
}

// Question types
export interface Question {
  text: string
  options: string[]
  correctOptionIndex: number
  timeLimit: number // in seconds
  difficulty: QuizDifficulty
}

// Quiz attempt types
export interface QuestionAttempt {
  questionIndex: number
  selectedOptionIndex: number | null
  timeSpent: number // in seconds
  optionSwitches: number
  skipped: boolean
}

export interface QuizAttempt {
  quizCode: string
  studentEmail: string
  startTime: number
  endTime: number
  totalTimeSpent: number // in seconds
  questionAttempts: QuestionAttempt[]
  score: number
  maxScore: number
  skippedCount: number
  efficiencyScore: number // score / time spent
}

// Analysis types
export interface TimeAnalysis {
  totalTime: number
  averageTimePerQuestion: number
  timePerQuestion: number[]
}

export interface PerformanceAnalysis {
  score: number
  maxScore: number
  percentage: number
  timeAnalysis: TimeAnalysis
  optionSwitchCount: number
  skippedCount: number
  hardQuestionsAccuracy: number
  efficiencyScore: number
  attemptSequence: number[]
  feedback: string
}

