"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/setup")
    }
  }, [session, router])

  const handleGetStarted = () => {
    router.push("/auth/signin")
  }

  const handlePlayNow = () => {
    router.push("/setup")
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="pb-8">
          <CardTitle className="text-4xl font-bold text-gray-900 mb-4">
            🗺️ States Learning Game
          </CardTitle>
          <p className="text-xl text-gray-600">
            Learn US states, capitals, and abbreviations through interactive gameplay
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4 text-left">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Interactive Learning</h3>
              <p className="text-sm text-blue-700">
                Click on state names while viewing an interactive map
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">📊 Track Progress</h3>
              <p className="text-sm text-green-700">
                Monitor your learning with scores and accuracy tracking
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">🏆 Multiple Levels</h3>
              <p className="text-sm text-purple-700">
                Start with easy mode and work your way up
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Currently Available:</h3>
            <div className="text-left">
              <h4 className="font-medium text-gray-800 mb-2">📍 Northeast Region</h4>
              <p className="text-sm text-gray-600 mb-2">
                Learn 11 northeast states: Connecticut, Delaware, Maine, Maryland, Massachusetts, 
                New Hampshire, New Jersey, New York, Pennsylvania, Rhode Island, and Vermont.
              </p>
              <p className="text-xs text-gray-500 italic">
                More regions and difficulty levels coming soon!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Sign In to Track Progress
            </Button>
            <Button
              onClick={handlePlayNow}
              variant="outline"
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Play Now (Guest)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}