import { NextResponse } from "next/server"
import { getQuizByCode, getQuizQuestions, addQuestionsToQuiz } from "@/lib/db"
import type { Question } from "@/lib/types"

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code

    const quiz = await getQuizByCode(code)
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const questions = await getQuizQuestions(code)

    return NextResponse.json({ quiz, questions })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code
    const { questions }: { questions: Question[] } = await request.json()

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Questions are required" }, { status: 400 })
    }

    const quiz = await getQuizByCode(code)
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    await addQuestionsToQuiz(code, questions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Add questions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

