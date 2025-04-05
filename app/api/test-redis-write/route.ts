import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Parse request body
    let data
    try {
      data = await request.json()
    } catch (parseError) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request body" 
      }, { status: 400 })
    }
    
    const { key, value } = data
    
    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: "Key is required" 
      }, { status: 400 })
    }
    
    console.log(`Testing Redis write: ${key} = ${value}`)
    
    // Import Redis dynamically
    let redis
    try {
      const { redis: redisClient } = await import("@/lib/db")
      redis = redisClient
    } catch (importError) {
      console.error("Failed to import Redis client:", importError)
      return NextResponse.json({
        success: false,
        error: `Failed to initialize Redis client: ${importError.message}`,
      })
    }
    
    // Test write operation
    try {
      const writeResult = await redis.set(key, value)
      
      return NextResponse.json({
        success: true,
        writeResult,
        key,
        value
      })
    } catch (writeError) {
      console.error("Redis write error:", writeError)
      return NextResponse.json({
        success: false,
        error: `Write failed: ${writeError.message}`,
      })
    }
  } catch (error) {
    console.error("Redis write test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
    })
  }
}
