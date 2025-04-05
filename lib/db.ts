import { Redis } from "@upstash/redis"
import { getValidUpstashUrl, getValidUpstashToken } from "./redis-config"

// Initialize Redis client with better error handling and logging
export const redis = new Redis({
  url: getValidUpstashUrl(),
  token: getValidUpstashToken(),
  retry: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 3000
  },
  onError: (err) => {
    console.error("Redis connection error:", err)
  },
})

// Add this function to test Redis connection and permissions
export async function testRedisConnection() {
  try {
    console.log("Testing Redis connection...")
    console.log("Redis URL:", getValidUpstashUrl() ? "Set" : "Not set")
    console.log("Redis Token:", getValidUpstashToken() ? "Set (hidden)" : "Not set")

    // Try a simple ping operation
    const pingResult = await redis.ping()
    console.log("Redis ping result:", pingResult)

    return pingResult === "PONG"
  } catch (error) {
    console.error("Redis connection test error:", error)
    return false
  }
}

export async function getUserByEmail(email: string) {
  // This is a placeholder. In a real application, you would
  // query a database to find the user by email.
  // For demonstration purposes, we'll just return a mock user.
  if (email === "test@example.com") {
    return {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      password: "password", // In real app, this would be a hashed password
    }
  }
  return null
}
