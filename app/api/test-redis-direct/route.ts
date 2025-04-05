import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Testing Redis connection directly...")
    
    // Collect environment variables (without exposing sensitive values)
    const envVars = {
      KV_URL: process.env.KV_URL ? (process.env.KV_URL.startsWith('https://') ? "set (valid HTTPS)" : "set (invalid format)") : "not set",
      REDIS_URL: process.env.REDIS_URL ? (
        process.env.REDIS_URL.startsWith('https://') ? "set (valid HTTPS)" : 
        process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.startsWith('redis://') ? 
        "set (Redis protocol - not compatible with REST client)" : "set (unknown format)"
      ) : "not set",
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? "set (hidden)" : "not set",
      KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN ? "set (hidden)" : "not set",
      REDIS_TOKEN: process.env.REDIS_TOKEN ? "set (hidden)" : "not set",
    }
    
    // Check if we have a valid URL format
    if ((process.env.KV_URL && !process.env.KV_URL.startsWith('https://')) || 
        (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('https://') && 
         (process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.startsWith('redis://')))) {
      return NextResponse.json({
        status: "error",
        message: "Invalid URL format for Upstash REST client",
        details: "The Upstash REST client requires an HTTPS URL, but a Redis protocol URL was provided. Please use the Upstash REST API URL instead.",
        envVars,
      })
    }
    
    // Import Redis dynamically to avoid initialization errors
    let redis
    try {
      const { redis: redisClient, testRedisConnection } = await import("@/lib/db")
      redis = redisClient
      
      // Test the connection
      const isConnected = await testRedisConnection()
      
      if (isConnected) {
        return NextResponse.json({
          status: "connected",
          message: "Redis connection test completed successfully",
          operations: {
            write: "untested",
            read: "untested"
          },
          envVars,
        })
      } else {
        return NextResponse.json({
          status: "disconnected",
          message: "Redis connection test failed",
          envVars,
        })
      }
    } catch (importError) {
      console.error("Failed to import Redis client:", importError)
      return NextResponse.json({
        status: "error",
        message: "Failed to initialize Redis client",
        error: importError.message,
        envVars,
      })
    }
  } catch (error) {
    console.error("Redis test error:", error)
    return NextResponse.json({
      status: "error",
      message: "Failed to test Redis connection",
      error: error.message || "Unknown error",
    })
  }
}
