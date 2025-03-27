import { Redis } from "@upstash/redis"

// Define the User type
interface User {
  email: string
  name: string
  // Add other user properties as needed
}

// Define the Quiz type
interface Quiz {
  teacherEmail: string
  title: string
  description: string
  code?: string
  questionCount?: number | string
  // Add other quiz properties as needed
}

// Define the Question type
interface Question {
  text: string
  options: string[]
  answer: string
  // Add other question properties as needed
}

// Define the QuizAttempt type
interface QuizAttempt {
  studentEmail: string
  quizCode: string
  answers: string[]
  score: number
  // Add other attempt properties as needed
}

// Initialize Redis client
export const redis = new Redis({
  url: process.env.REDIS_URL || process.env.KV_URL || "",
  token: process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN || "",
})

// User-related functions
export async function createUser(userData: User): Promise<string> {
  const userId = `user:${userData.email}`
  await redis.hset(userId, userData)
  return userId
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = `user:${email}`
  const user = await redis.hgetall(userId)
  return Object.keys(user).length > 0 ? (user as unknown as User) : null
}

// Quiz-related functions
export async function createQuiz(quizData: Quiz): Promise<string> {
  // Generate a unique 6-character quiz code
  const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Store the quiz with its code as part of the key
  const quizId = `quiz:${quizCode}`
  await redis.hset(quizId, { ...quizData, code: quizCode })

  // Add to teacher's quiz list
  await redis.sadd(`teacher:${quizData.teacherEmail}:quizzes`, quizId)

  return quizCode
}

export async function getQuizByCode(code: string): Promise<Quiz | null> {
  const quizId = `quiz:${code}`
  const quiz = await redis.hgetall(quizId)
  return Object.keys(quiz).length > 0 ? (quiz as unknown as Quiz) : null
}

export async function getTeacherQuizzes(teacherEmail: string): Promise<Quiz[]> {
  const quizIds = await redis.smembers(`teacher:${teacherEmail}:quizzes`)

  if (quizIds.length === 0) return []

  const quizzes = await Promise.all(
    quizIds.map(async (quizId) => {
      const quiz = await redis.hgetall(quizId)
      return quiz as unknown as Quiz
    }),
  )

  return quizzes
}

// Question-related functions
export async function addQuestionsToQuiz(quizCode: string, questions: Question[]): Promise<void> {
  for (let i = 0; i < questions.length; i++) {
    const questionId = `quiz:${quizCode}:question:${i}`
    await redis.hset(questionId, questions[i])
  }

  // Store the number of questions
  await redis.hset(`quiz:${quizCode}`, { questionCount: questions.length })
}

export async function getQuizQuestions(quizCode: string): Promise<Question[]> {
  const quiz = await getQuizByCode(quizCode)
  if (!quiz) return []

  const questionCount = Number.parseInt(quiz.questionCount as string) || 0
  const questions: Question[] = []

  for (let i = 0; i < questionCount; i++) {
    const questionId = `quiz:${quizCode}:question:${i}`
    const question = await redis.hgetall(questionId)
    if (Object.keys(question).length > 0) {
      questions.push(question as unknown as Question)
    }
  }

  return questions
}

// Attempt-related functions
export async function recordQuizAttempt(attemptData: QuizAttempt): Promise<string> {
  const attemptId = `attempt:${attemptData.studentEmail}:${attemptData.quizCode}:${Date.now()}`
  await redis.hset(attemptId, attemptData)

  // Add to student's attempts list
  await redis.sadd(`student:${attemptData.studentEmail}:attempts`, attemptId)

  // Add to quiz's attempts list
  await redis.sadd(`quiz:${attemptData.quizCode}:attempts`, attemptId)

  return attemptId
}

export async function getStudentAttempts(studentEmail: string): Promise<QuizAttempt[]> {
  const attemptIds = await redis.smembers(`student:${studentEmail}:attempts`)

  if (attemptIds.length === 0) return []

  const attempts = await Promise.all(
    attemptIds.map(async (attemptId) => {
      const attempt = await redis.hgetall(attemptId)
      return attempt as unknown as QuizAttempt
    }),
  )

  return attempts
}

export async function getQuizAttempts(quizCode: string): Promise<QuizAttempt[]> {
  const attemptIds = await redis.smembers(`quiz:${quizCode}:attempts`)

  if (attemptIds.length === 0) return []

  const attempts = await Promise.all(
    attemptIds.map(async (attemptId) => {
      const attempt = await redis.hgetall(attemptId)
      return attempt as unknown as QuizAttempt
    }),
  )

  return attempts
}

