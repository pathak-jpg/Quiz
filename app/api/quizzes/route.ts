import { NextResponse } from "next/server"
import { createQuiz, getTeacherQuizzes } from "@/lib/db"
import type { Quiz } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const quizData: Quiz = await request.json()

    if (!quizData.title || !quizData.teacherEmail || !quizData.totalTimeLimit) {
      return NextResponse.json({ error: "Required quiz fields are missing" }, { status: 400 })
    }

    // Add creation timestamp
    quizData.createdAt = Date.now()

    const quizCode = await createQuiz(quizData)

    return NextResponse.json({ quizCode }, { status: 201 })
  } catch (error) {
    console.error("Create quiz error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherEmail = searchParams.get("teacherEmail")

    if (!teacherEmail) {
      return NextResponse.json({ error: "Teacher email is required" }, { status: 400 })
    }

    const quizzes = await getTeacherQuizzes(teacherEmail)

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

