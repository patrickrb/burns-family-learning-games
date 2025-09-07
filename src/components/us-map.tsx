"use client"

import { useState, useRef, useEffect } from "react"

interface USMapProps {
  highlightedState?: string
  onStateClick?: (stateId: string) => void
  correctStates?: string[]
  incorrectStates?: string[]
}

// Northeast states we want to make interactive
const northeastStates = [
  'CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'
]

export default function USMap({ 
  highlightedState, 
  onStateClick, 
  correctStates = [],
  incorrectStates = []
}: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const getStateColor = (stateId: string) => {
    if (correctStates.includes(stateId)) {
      return "#10b981" // green for correct
    }
    if (incorrectStates.includes(stateId)) {
      return "#ef4444" // red for incorrect
    }
    if (highlightedState === stateId) {
      return "#fbbf24" // bright yellow for highlighted state to guess
    }
    if (hoveredState === stateId) {
      return "#e5e7eb" // light gray for hover
    }
    return "#ffffff" // white for default northeast states
  }

  // Zoom and pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 0.1
    const newZoom = e.deltaY > 0 
      ? Math.max(0.5, zoom - zoomFactor) 
      : Math.min(3, zoom + zoomFactor)
    setZoom(newZoom)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    setLastPanPoint({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    
    const deltaX = e.clientX - lastPanPoint.x
    const deltaY = e.clientY - lastPanPoint.y
    
    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
    
    setLastPanPoint({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const resetZoomAndPan = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Load and setup SVG when component mounts
  useEffect(() => {
    fetch('/map.svg')
      .then(response => response.text())
      .then(svgText => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText
          
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            // Make SVG responsive
            svgElement.setAttribute('width', '100%')
            svgElement.setAttribute('height', '100%')
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

            // Set up event listeners for northeast states
            northeastStates.forEach(stateId => {
              const stateClass = stateId.toLowerCase()
              const stateElement = svgElement.querySelector(`.${stateClass}`)
              
              if (stateElement) {
                stateElement.addEventListener('mouseenter', () => setHoveredState(stateId))
                stateElement.addEventListener('mouseleave', () => setHoveredState(null))
                stateElement.addEventListener('click', () => onStateClick?.(stateId))
                stateElement.style.cursor = 'pointer'
              }
            })
          }
        }
      })
      .catch(error => {
        console.error('Error loading SVG:', error)
      })
  }, [onStateClick])

  // Update colors when game state changes
  useEffect(() => {
    if (!containerRef.current) return

    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) return

    // Update northeast states colors
    northeastStates.forEach(stateId => {
      const stateClass = stateId.toLowerCase()
      const stateElement = svgElement.querySelector(`.${stateClass}`)
      
      if (stateElement) {
        const color = getStateColor(stateId)
        stateElement.setAttribute('fill', color)
      }
    })
  }, [highlightedState, hoveredState, correctStates, incorrectStates])

  return (
    <div className="w-full h-full">
      <div className="relative bg-gradient-to-b from-sky-100 to-blue-200 rounded-lg border-2 border-gray-300 shadow-lg p-2 h-full">
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{ 
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))',
            minHeight: '400px',
            cursor: isPanning ? 'grabbing' : 'grab'
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            ref={containerRef}
            className="max-w-full max-h-full transition-transform duration-200 ease-out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded shadow-md transition-colors"
            title="Zoom In"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded shadow-md transition-colors"
            title="Zoom Out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button
            onClick={resetZoomAndPan}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded shadow-md transition-colors"
            title="Reset View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <h2 className="text-lg font-bold text-gray-800 bg-white/80 px-3 py-1 rounded shadow-sm">
            Northeast United States
          </h2>
        </div>

        {/* Compass Rose */}
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 bg-white/90 rounded-full border border-gray-400 flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-gray-700 border-l-transparent border-r-transparent"></div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 text-xs font-bold text-gray-700">N</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Legend */}
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-400 rounded mr-2 shadow-sm"></div>
          <span className="font-medium">Find This State</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2 shadow-sm"></div>
          <span className="font-medium">Correct</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2 shadow-sm"></div>
          <span className="font-medium">Incorrect</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-300 rounded mr-2 shadow-sm"></div>
          <span className="font-medium">Unplayed</span>
        </div>
      </div>
    </div>
  )
}