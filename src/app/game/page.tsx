"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import USMap from "@/components/us-map"
import StateList from "@/components/state-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GameState {
  currentStateId: string
  score: number
  attempts: number
  correctAnswers: number
  correctStates: string[]
  incorrectStates: string[]
  selectedStates: string[]
  gameComplete: boolean
}

const northeastStates = [
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NY", name: "New York" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "VT", name: "Vermont" },
]

export default function GamePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [gameState, setGameState] = useState<GameState>({
    currentStateId: "",
    score: 0,
    attempts: 0,
    correctAnswers: 0,
    correctStates: [],
    incorrectStates: [],
    selectedStates: [],
    gameComplete: false,
  })

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  })

  // Allow guest play - no redirect needed

  // Initialize game with random state
  const getRandomState = useCallback(() => {
    const availableStates = northeastStates.filter(
      (state) => !gameState.correctStates.includes(state.id)
    )
    if (availableStates.length === 0) return null
    const randomIndex = Math.floor(Math.random() * availableStates.length)
    return availableStates[randomIndex].id
  }, [gameState.correctStates])

  const initializeGame = useCallback(() => {
    const firstState = northeastStates[Math.floor(Math.random() * northeastStates.length)]
    setGameState(prev => ({
      ...prev,
      currentStateId: firstState.id,
      gameComplete: false,
    }))
  }, [])

  const nextState = useCallback(() => {
    const nextStateId = getRandomState()
    if (nextStateId) {
      setGameState(prev => ({
        ...prev,
        currentStateId: nextStateId,
      }))
      setFeedback({ message: "", type: null })
    } else {
      setGameState(prev => ({
        ...prev,
        gameComplete: true,
      }))
    }
  }, [getRandomState])

  // Initialize game on component mount
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const handleStateSelect = async (selectedStateId: string) => {
    const isCorrect = selectedStateId === gameState.currentStateId
    
    setGameState(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      score: isCorrect ? prev.score + 10 : prev.score,
      correctStates: isCorrect 
        ? [...prev.correctStates, selectedStateId]
        : prev.correctStates,
      incorrectStates: !isCorrect 
        ? [...prev.incorrectStates, selectedStateId]
        : prev.incorrectStates,
      selectedStates: [...prev.selectedStates, selectedStateId],
    }))

    if (isCorrect) {
      const currentStateName = northeastStates.find(s => s.id === gameState.currentStateId)?.name
      setFeedback({
        message: `Correct! That's ${currentStateName}!`,
        type: "success"
      })
      
      // Move to next state after a delay
      setTimeout(() => {
        nextState()
      }, 1500)
    } else {
      const selectedStateName = northeastStates.find(s => s.id === selectedStateId)?.name
      const currentStateName = northeastStates.find(s => s.id === gameState.currentStateId)?.name
      setFeedback({
        message: `That's ${selectedStateName}. The highlighted state is ${currentStateName}. Try again!`,
        type: "error"
      })
      
      // Clear feedback after delay but don't move to next state
      setTimeout(() => {
        setFeedback({ message: "", type: null })
      }, 3000)
    }

    // Save progress to database (only if user is logged in)
    if (session?.user?.email) {
      try {
        await fetch("/api/game/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            difficulty: "easy",
            region: "northeast",
            isCorrect,
          }),
        })
      } catch (error) {
        console.error("Error saving progress:", error)
      }
    }
  }

  const resetGame = () => {
    setGameState({
      currentStateId: "",
      score: 0,
      attempts: 0,
      correctAnswers: 0,
      correctStates: [],
      incorrectStates: [],
      selectedStates: [],
      gameComplete: false,
    })
    setFeedback({ message: "", type: null })
    initializeGame()
  }

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (gameState.gameComplete) {
    const accuracy = gameState.attempts > 0 ? Math.round((gameState.correctAnswers / gameState.attempts) * 100) : 0
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-green-600 mb-4">
                🎉 Congratulations!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl">You've completed the Northeast States game!</p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="bg-blue-100 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">{gameState.score}</div>
                  <div className="text-sm text-blue-800">Total Score</div>
                </div>
                <div className="bg-green-100 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                  <div className="text-sm text-green-800">Accuracy</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {gameState.correctAnswers} correct out of {gameState.attempts} attempts
              </div>
              <Button onClick={resetGame} size="lg" className="mt-4">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentStateName = northeastStates.find(s => s.id === gameState.currentStateId)?.name

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/")}
              >
                ← Home
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                Northeast States Game
              </h1>
            </div>
            <div className="text-right">
              {session ? (
                <div>
                  <p className="text-sm text-gray-600">Logged in as</p>
                  <p className="font-medium text-gray-900">{session.user?.name}</p>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/auth/signin")}
                >
                  Sign In to Track Progress
                </Button>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Find the highlighted state on the map
          </p>
          
          {/* Score Board */}
          <div className="flex justify-center space-x-6 mb-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">Score: </span>
              <span className="font-bold text-blue-600">{gameState.score}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">Correct: </span>
              <span className="font-bold text-green-600">{gameState.correctAnswers}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-600">Attempts: </span>
              <span className="font-bold text-gray-800">{gameState.attempts}</span>
            </div>
            {!session && (
              <div className="bg-yellow-100 px-4 py-2 rounded-lg shadow border-yellow-300">
                <span className="text-sm text-yellow-800">Playing as Guest</span>
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback.message && (
            <div className={`p-3 rounded-lg mb-4 ${
              feedback.type === "success" 
                ? "bg-green-100 border border-green-300 text-green-800" 
                : "bg-red-100 border border-red-300 text-red-800"
            }`}>
              {feedback.message}
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Map */}
          <div className="order-2 md:order-1">
            <USMap
              highlightedState={gameState.currentStateId}
              onStateClick={handleStateSelect}
              correctStates={gameState.correctStates}
              incorrectStates={gameState.incorrectStates}
            />
          </div>

          {/* State List */}
          <div className="order-1 md:order-2">
            <StateList
              onStateSelect={handleStateSelect}
              selectedStates={gameState.selectedStates}
              correctStates={gameState.correctStates}
              incorrectStates={gameState.incorrectStates}
              disabled={feedback.type === "success"}
            />
            
            <div className="mt-4 text-center">
              <Button
                onClick={resetGame}
                variant="outline"
                size="sm"
              >
                Reset Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}