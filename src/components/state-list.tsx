"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface State {
  id: string
  name: string
  abbreviation: string
}

const northeastStates: State[] = [
  { id: "CT", name: "Connecticut", abbreviation: "CT" },
  { id: "DE", name: "Delaware", abbreviation: "DE" },
  { id: "ME", name: "Maine", abbreviation: "ME" },
  { id: "MD", name: "Maryland", abbreviation: "MD" },
  { id: "MA", name: "Massachusetts", abbreviation: "MA" },
  { id: "NH", name: "New Hampshire", abbreviation: "NH" },
  { id: "NJ", name: "New Jersey", abbreviation: "NJ" },
  { id: "NY", name: "New York", abbreviation: "NY" },
  { id: "PA", name: "Pennsylvania", abbreviation: "PA" },
  { id: "RI", name: "Rhode Island", abbreviation: "RI" },
  { id: "VT", name: "Vermont", abbreviation: "VT" },
]

interface StateListProps {
  onStateSelect: (stateId: string) => void
  selectedStates: string[]
  correctStates: string[]
  incorrectStates: string[]
  disabled?: boolean
}

export default function StateList({
  onStateSelect,
  selectedStates,
  correctStates,
  incorrectStates,
  disabled = false
}: StateListProps) {
  const getButtonVariant = (stateId: string) => {
    if (correctStates.includes(stateId)) {
      return "default"
    }
    if (incorrectStates.includes(stateId)) {
      return "destructive"
    }
    if (selectedStates.includes(stateId)) {
      return "secondary"
    }
    return "outline"
  }

  const isStateDisabled = (stateId: string) => {
    return disabled || correctStates.includes(stateId) || incorrectStates.includes(stateId)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select the State</CardTitle>
        <p className="text-sm text-gray-600">
          Click on the state name that matches the highlighted state on the map.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {northeastStates
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((state) => (
              <Button
                key={state.id}
                variant={getButtonVariant(state.id)}
                size="sm"
                onClick={() => onStateSelect(state.id)}
                disabled={isStateDisabled(state.id)}
                className={`justify-start text-left h-auto py-3 px-4 ${
                  correctStates.includes(state.id)
                    ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-100"
                    : incorrectStates.includes(state.id)
                    ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-100"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{state.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {state.abbreviation}
                  </span>
                </div>
              </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}