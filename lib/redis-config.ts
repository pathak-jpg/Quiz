// Helper functions for Redis configuration
export function getValidUpstashUrl() {
  // Check for KV_URL (REST API URL)
  if (process.env.KV_URL && process.env.KV_URL.startsWith('https://')) {
    return process.env.KV_URL
  }
  
  // Check for REDIS_URL (might be Redis protocol URL)
  if (process.env.REDIS_URL) {
    // If it's already an HTTPS URL, use it
    if (process.env.REDIS_URL.startsWith('https://')) {
      return process.env.REDIS_URL
    }
  }
  
  // No valid URL found - use the one provided by the user
  return "https://meet-sailfish-43983.upstash.io"
}

// Function to get the appropriate token
export function getValidUpstashToken() {
  // For REST API, we need KV_REST_API_TOKEN
  if (process.env.KV_REST_API_TOKEN) {
    return process.env.KV_REST_API_TOKEN
  }
  
  // Fall back to REDIS_TOKEN if available
  if (process.env.REDIS_TOKEN) {
    return process.env.REDIS_TOKEN
  }
  
  // Return empty string if no token is found
  return ""
}
