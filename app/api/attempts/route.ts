import { NextResponse } from "next/server"
import { recordQuizAttempt, getStudentAttempts, getQuizAttempts } from "@/lib/db"
import type { QuizAttempt } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const attemptData: QuizAttempt = await request.json()

    if (!attemptData.quizCode || !attemptData.studentEmail) {
      return NextResponse.json({ error: "Required attempt fields are missing" }, { status: 400 })
    }

    const attemptId = await recordQuizAttempt(attemptData)

    return NextResponse.json({ attemptId }, { status: 201 })
  } catch (error) {
    console.error("Record attempt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentEmail = searchParams.get("studentEmail")
    const quizCode = searchParams.get("quizCode")

    if (studentEmail) {
      const attempts = await getStudentAttempts(studentEmail)
      return NextResponse.json(attempts)
    } else if (quizCode) {
      const attempts = await getQuizAttempts(quizCode)
      return NextResponse.json(attempts)
    } else {
      return NextResponse.json({ error: "Either studentEmail or quizCode is required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Get attempts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

