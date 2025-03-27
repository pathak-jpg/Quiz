import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // In a real app, you would hash and compare passwords
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

