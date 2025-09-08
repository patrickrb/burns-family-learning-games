"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Region = "northeast" | "southeast" | "midwest" | "west" | "southwest"
type GameMode = "states" | "capitals"

interface RegionOption {
  id: Region
  name: string
  description: string
  available: boolean
  stateCount: number
}

const regions: RegionOption[] = [
  {
    id: "northeast",
    name: "Northeast",
    description: "Connecticut, Delaware, Maine, Maryland, Massachusetts, New Hampshire, New Jersey, New York, Pennsylvania, Rhode Island, Vermont",
    available: true,
    stateCount: 11
  },
  {
    id: "southeast",
    name: "Southeast", 
    description: "Coming soon - Florida, Georgia, South Carolina, North Carolina, Virginia, West Virginia, Kentucky, Tennessee, Alabama, Mississippi, Arkansas, Louisiana",
    available: false,
    stateCount: 12
  },
  {
    id: "midwest",
    name: "Midwest",
    description: "Coming soon - Illinois, Indiana, Iowa, Kansas, Michigan, Minnesota, Missouri, Nebraska, North Dakota, Ohio, South Dakota, Wisconsin",
    available: false,
    stateCount: 12
  },
  {
    id: "west",
    name: "West",
    description: "Coming soon - Alaska, California, Colorado, Hawaii, Idaho, Montana, Nevada, Oregon, Utah, Washington, Wyoming",
    available: false,
    stateCount: 11
  },
  {
    id: "southwest",
    name: "Southwest",
    description: "Coming soon - Arizona, New Mexico, Oklahoma, Texas",
    available: false,
    stateCount: 4
  }
]

export default function SetupPage() {
  const router = useRouter()
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null)

  const handleStartGame = () => {
    if (selectedRegion && selectedGameMode) {
      // Navigate to game with query parameters
      router.push(`/game?region=${selectedRegion}&mode=${selectedGameMode}`)
    }
  }

  const canStartGame = selectedRegion && selectedGameMode && regions.find(r => r.id === selectedRegion)?.available

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/")}
            >
              ← Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Game Setup
            </h1>
            <div></div>
          </div>
          <p className="text-gray-600">
            Choose your region and game mode to get started
          </p>
        </div>

        <div className="space-y-8">
          {/* Region Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Step 1: Choose a Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      !region.available 
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        : selectedRegion === region.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                    }`}
                    onClick={() => region.available && setSelectedRegion(region.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold ${
                        region.available ? "text-gray-900" : "text-gray-500"
                      }`}>
                        {region.name}
                      </h3>
                      <div className={`text-sm px-2 py-1 rounded ${
                        region.available 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {region.stateCount} states
                      </div>
                    </div>
                    <p className={`text-sm ${
                      region.available ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {region.description}
                    </p>
                    {!region.available && (
                      <div className="absolute top-2 right-2">
                        <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                          Soon
                        </div>
                      </div>
                    )}
                    {selectedRegion === region.id && (
                      <div className="absolute top-2 right-2">
                        <div className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          ✓ Selected
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Mode Selection */}
          <Card className={selectedRegion ? "" : "opacity-50"}>
            <CardHeader>
              <CardTitle className="text-xl">Step 2: Choose Game Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    !selectedRegion
                      ? "border-gray-200 cursor-not-allowed"
                      : selectedGameMode === "states"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                  }`}
                  onClick={() => selectedRegion && setSelectedGameMode("states")}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🗺️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Name the States</h3>
                    <p className="text-gray-600 mb-4">
                      Look at the highlighted area on the map and click the correct state name.
                    </p>
                    <div className="text-sm text-gray-500">
                      Example: See New York highlighted → Click &ldquo;New York&rdquo;
                    </div>
                    {selectedGameMode === "states" && (
                      <div className="mt-4">
                        <div className="text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded inline-block">
                          ✓ Selected
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    !selectedRegion
                      ? "border-gray-200 cursor-not-allowed"
                      : selectedGameMode === "capitals"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                  }`}
                  onClick={() => selectedRegion && setSelectedGameMode("capitals")}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏛️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Name the Capitals</h3>
                    <p className="text-gray-600 mb-4">
                      See a state name and click the correct capital city.
                    </p>
                    <div className="text-sm text-gray-500">
                      Example: See &ldquo;New York&rdquo; → Click &ldquo;Albany&rdquo;
                    </div>
                    {selectedGameMode === "capitals" && (
                      <div className="mt-4">
                        <div className="text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded inline-block">
                          ✓ Selected
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Game Button */}
          <div className="text-center">
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              size="lg"
              className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
            >
              {!selectedRegion || !selectedGameMode 
                ? "Select Region and Game Mode" 
                : !regions.find(r => r.id === selectedRegion)?.available
                ? "Region Not Available Yet"
                : "Start Game"
              }
            </Button>
            {selectedRegion && selectedGameMode && regions.find(r => r.id === selectedRegion)?.available && (
              <p className="text-sm text-gray-600 mt-2">
                Playing {selectedGameMode === "states" ? "Name the States" : "Name the Capitals"} in the {regions.find(r => r.id === selectedRegion)?.name} region
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}