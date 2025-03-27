import { NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/db"
import type { User } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const userData: User = await request.json()

    if (!userData.email || !userData.password || !userData.name || !userData.role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // In a real app, you would hash the password here
    await createUser(userData)

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = userData

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

