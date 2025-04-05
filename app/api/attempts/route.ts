import { NextResponse } from "next/server"
import { redis } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get("quizId")
    
    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }
    
    // Get attempts for the quiz
    const attemptsKey = `quiz:${quizId}:attempts`
    const attempts = await redis.lrange(attemptsKey, 0, -1)
    
    // Parse the attempts (they are stored as JSON strings)
    const parsedAttempts = attempts.map(attempt => {
      try {
        return JSON.parse(attempt)
      } catch (e) {
        return attempt
      }
    })
    
    return NextResponse.json({ attempts: parsedAttempts })
  } catch (error) {
    console.error("Error fetching attempts:", error)
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { quizId, studentId, answers, score } = data
    
    if (!quizId || !studentId) {
      return NextResponse.json(
        { error: "Quiz ID and student ID are required" },
        { status: 400 }
      )
    }
    
    // Create attempt object
    const attempt = {
      quizId,
      studentId,
      answers: answers || [],
      score: score || 0,
      timestamp: Date.now()
    }
    
    // Store the attempt
    const attemptsKey = `quiz:${quizId}:attempts`
    await redis.lpush(attemptsKey, JSON.stringify(attempt))
    
    // Also store in student's attempts
    const studentAttemptsKey = `student:${studentId}:attempts`
    await redis.lpush(studentAttemptsKey, JSON.stringify(attempt))
    
    return NextResponse.json({ success: true, attempt })
  } catch (error) {
    console.error("Error saving attempt:", error)
    return NextResponse.json(
      { error: "Failed to save attempt" },
      { status: 500 }
    )
  }
}
