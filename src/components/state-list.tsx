"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StateData } from "@/data/states"

type GameMode = "states" | "capitals"

interface StateListProps {
  onStateSelect: (stateId: string) => void
  correctStates: string[]
  incorrectStates: string[]
  disabled?: boolean
  gameMode: GameMode
  statesData: StateData[]
}

export default function StateList({
  onStateSelect,
  correctStates,
  incorrectStates,
  disabled = false,
  gameMode,
  statesData
}: StateListProps) {
  // Create options list based on game mode
  const getOptions = () => {
    if (gameMode === "states") {
      return statesData.map(state => ({ id: state.id, displayName: state.name, abbrev: state.abbreviation }))
    } else {
      // For capitals mode, we want to display capital names and return capital names when clicked
      return statesData.map(state => ({ id: state.capital, displayName: state.capital, abbrev: state.abbreviation }))
    }
  }

  const options = getOptions()

  const getButtonVariant = (optionId: string) => {
    // For states mode, optionId is stateId
    // For capitals mode, optionId is capital name
    if (gameMode === "states") {
      if (correctStates.includes(optionId)) {
        return "default"
      }
      if (incorrectStates.includes(optionId)) {
        return "destructive"
      }
    } else {
      // For capitals, incorrectStates contains capital names
      if (incorrectStates.includes(optionId)) {
        return "destructive"
      }
      // Check if this capital belongs to a correct state
      const stateForCapital = statesData.find(s => s.capital === optionId)
      if (stateForCapital && correctStates.includes(stateForCapital.id)) {
        return "default"
      }
    }
    return "outline"
  }

  const isOptionDisabled = (optionId: string) => {
    if (gameMode === "states") {
      return disabled || correctStates.includes(optionId) || incorrectStates.includes(optionId)
    } else {
      // For capitals mode
      const stateForCapital = statesData.find(s => s.capital === optionId)
      const isCapitalCorrect = stateForCapital && correctStates.includes(stateForCapital.id)
      const isCapitalIncorrect = incorrectStates.includes(optionId)
      return disabled || isCapitalCorrect || isCapitalIncorrect
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {gameMode === "states" ? "Select the State" : "Select the Capital"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {gameMode === "states" 
            ? "Click on the state name that matches the highlighted state on the map."
            : "Click on the capital city name that matches the shown state."
          }
        </p>
      </div>
      <Card className="w-full">
        <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-2">
          {options
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map((option) => {
              const isCorrect = gameMode === "states" 
                ? correctStates.includes(option.id)
                : (() => {
                    const stateForCapital = statesData.find(s => s.capital === option.id)
                    return stateForCapital && correctStates.includes(stateForCapital.id)
                  })()
              const isIncorrect = incorrectStates.includes(option.id)
              
              return (
                <Button
                  key={option.id}
                  variant={getButtonVariant(option.id)}
                  size="sm"
                  onClick={() => onStateSelect(option.id)}
                  disabled={isOptionDisabled(option.id)}
                  className={`justify-start text-left h-auto py-3 px-4 ${
                    isCorrect
                      ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-100"
                      : isIncorrect
                      ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-100"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium">{option.displayName}</span>
                    {gameMode === "states" && (
                      <span className="text-xs text-gray-500 ml-2">
                        {option.abbrev}
                      </span>
                    )}
                  </div>
                </Button>
              )
            })}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}