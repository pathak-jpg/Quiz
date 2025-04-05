import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    
    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: "Key parameter is required" 
      }, { status: 400 })
    }
    
    console.log(`Testing Redis read: ${key}`)
    
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
    
    // Test read operation
    try {
      const value = await redis.get(key)
      
      return NextResponse.json({
        success: true,
        key,
        value: value !== null ? value : "(null)"
      })
    } catch (readError) {
      console.error("Redis read error:", readError)
      return NextResponse.json({
        success: false,
        error: `Read failed: ${readError.message}`,
      })
    }
  } catch (error) {
    console.error("Redis read test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
    })
  }
}
