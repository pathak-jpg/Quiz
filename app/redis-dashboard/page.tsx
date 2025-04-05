"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, Key, RefreshCw, X, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RedisDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "disconnected">("loading")
  const [writeStatus, setWriteStatus] = useState<"untested" | "success" | "failed">("untested")
  const [readStatus, setReadStatus] = useState<"untested" | "success" | "failed">("untested")
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [testKey, setTestKey] = useState("test-key")
  const [testValue, setTestValue] = useState("test-value")
  const [readValue, setReadValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [details, setDetails] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    checkConnection()
  }, [])

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)])
  }

  const checkConnection = async () => {
    try {
      setLoading(true)
      setConnectionStatus("loading")
      setDetails("")
      addLog("Checking Redis connection...")
    
      // Use a direct Redis test instead of relying on the diagnostics endpoint
      const response = await fetch("/api/test-redis-direct")
    
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response")
        throw new Error(`Server error: ${response.status}. ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`)
      }
    
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${jsonError.message}`)
      }
    
      // Set environment variables
      setEnvVars(data.envVars || {})
    
      // Check for details message
      if (data.details) {
        setDetails(data.details)
        addLog(`ℹ️ ${data.details}`)
      }
    
      // Check connection status
      if (data.status === "connected") {
        setConnectionStatus("connected")
        addLog("✅ Redis connection successful")
      
        // Now that we know Redis is connected, test write and read operations
        await testWrite()
        await testRead()
      } else if (data.status === "error") {
        setConnectionStatus("disconnected")
        setWriteStatus("failed")
        setReadStatus("failed")
        addLog(`❌ Redis connection error: ${data.message || "Unknown error"}`)
        setError(data.message || "Failed to connect to Redis")
        if (data.error) {
          addLog(`❌ Error details: ${data.error}`)
        }
      } else {
        setConnectionStatus("disconnected")
        setWriteStatus("failed")
        setReadStatus("failed")
        addLog(`❌ Redis connection failed: ${data.message || "Unknown error"}`)
        setError(data.message || "Failed to connect to Redis")
      }
    } catch (err) {
      console.error("Error checking connection:", err)
      setConnectionStatus("disconnected")
      setWriteStatus("failed")
      setReadStatus("failed")
      setError(err.message || "Failed to check Redis connection")
      addLog(`❌ Error checking connection: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testWrite = async () => {
    try {
      setLoading(true)
      setWriteStatus("untested")
      addLog(`Testing write operation: ${testKey} = ${testValue}`)

      const response = await fetch("/api/test-redis-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: testKey, value: testValue }),
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText}`)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${jsonError.message}`)
      }

      if (data.success) {
        setWriteStatus("success")
        addLog("✅ Write operation successful")
      } else {
        setWriteStatus("failed")
        addLog(`❌ Write operation failed: ${data.error}`)
        setError(data.error || "Write operation failed")
      }
    } catch (err) {
      console.error("Error testing write:", err)
      setWriteStatus("failed")
      setError(err.message || "Failed to test write operation")
      addLog(`❌ Error testing write: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testRead = async () => {
    try {
      setLoading(true)
      setReadStatus("untested")
      addLog(`Testing read operation: ${testKey}`)

      const response = await fetch(`/api/test-redis-read?key=${encodeURIComponent(testKey)}`)

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText}`)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${jsonError.message}`)
      }

      if (data.success) {
        setReadStatus("success")
        setReadValue(data.value)
        addLog(`✅ Read operation successful: ${data.value}`)
      } else {
        setReadStatus("failed")
        setReadValue("")
        addLog(`❌ Read operation failed: ${data.error}`)
        setError(data.error || "Read operation failed")
      }
    } catch (err) {
      console.error("Error testing read:", err)
      setReadStatus("failed")
      setError(err.message || "Failed to test read operation")
      addLog(`❌ Error testing read: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Redis Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              {connectionStatus === "loading" ? (
                <Badge className="bg-yellow-500">Checking...</Badge>
              ) : connectionStatus === "connected" ? (
                <Badge className="bg-green-500">Connected</Badge>
              ) : (
                <Badge className="bg-red-500">Disconnected</Badge>
              )}
              <Button variant="ghost" size="icon" className="ml-auto" onClick={checkConnection} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Write Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {writeStatus === "untested" ? (
                <Badge variant="outline">Not Tested</Badge>
              ) : writeStatus === "success" ? (
                <Badge className="bg-green-500">Success</Badge>
              ) : (
                <Badge className="bg-red-500">Failed</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Read Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {readStatus === "untested" ? (
                <Badge variant="outline">Not Tested</Badge>
              ) : readStatus === "success" ? (
                <Badge className="bg-green-500">Success</Badge>
              ) : (
                <Badge className="bg-red-500">Failed</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {details && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription>{details}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="operations" className="mb-6">
        <TabsList>
          <TabsTrigger value="operations">Test Operations</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Test Redis Operations</CardTitle>
              <CardDescription>Test read and write operations to verify your Redis connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-key">Key</Label>
                  <Input
                    id="test-key"
                    value={testKey}
                    onChange={(e) => setTestKey(e.target.value)}
                    placeholder="Enter key name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-value">Value</Label>
                  <Input
                    id="test-value"
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={testWrite} disabled={loading || !testKey || !testValue || connectionStatus !== "connected"} className="w-full">
                  {loading ? "Testing..." : "Test Write"}
                </Button>
                <Button onClick={testRead} disabled={loading || !testKey || connectionStatus !== "connected"} variant="outline" className="w-full">
                  {loading ? "Testing..." : "Test Read"}
                </Button>
              </div>

              {readStatus === "success" && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium">Read Result:</p>
                  <pre className="mt-2 p-2 bg-background rounded border overflow-x-auto">{readValue || "(empty)"}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if your Redis environment variables are properly set</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    <span className="font-medium">{key}:</span>
                    <span className="ml-2">{value}</span>
                    {value.includes("valid") || value === "set (hidden)" ? (
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    ) : value.includes("invalid") || value.includes("not compatible") ? (
                      <AlertCircle className="h-4 w-4 ml-2 text-yellow-500" />
                    ) : value === "not set" ? (
                      <X className="h-4 w-4 ml-2 text-red-500" />
                    ) : (
                      <Info className="h-4 w-4 ml-2 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> For write operations, you need to use the full access token (KV_REST_API_TOKEN),
                not the read-only token.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> The Upstash REST client requires an HTTPS URL (starting with https://),
                not a Redis protocol URL (starting with redis:// or rediss://).
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Operation Logs</CardTitle>
              <CardDescription>Recent Redis operations and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md h-[300px] overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
