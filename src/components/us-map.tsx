"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface USMapProps {
  highlightedState?: string
  onStateClick?: (stateId: string) => void
  correctStates?: string[]
  incorrectStates?: string[]
  renderKey?: number // Add a key to force re-renders
}

// Northeast states we want to make interactive
const northeastStates = [
  'CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'
]

export default function USMap({ 
  highlightedState, 
  onStateClick, 
  correctStates = [],
  incorrectStates = [],
  renderKey = 0
}: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)


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

  // Track SVG load state
  const [svgLoaded, setSvgLoaded] = useState(false)
  // Track state positions for React-controlled highlighting
  const [statePositions, setStatePositions] = useState<Record<string, { x: number, y: number, width: number, height: number }>>({})

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

            // Hide all non-northeast states and setup northeast states
            const allStatePaths = svgElement.querySelectorAll('path[class]')
            allStatePaths.forEach(stateElement => {
              const stateClass = stateElement.getAttribute('class')
              if (stateClass && !northeastStates.some(ne => stateClass === ne.toLowerCase())) {
                // Hide non-northeast states
                stateElement.style.display = 'none'
              } else if (stateClass && northeastStates.some(ne => stateClass === ne.toLowerCase())) {
                // Set up northeast states
                const stateId = stateClass.toUpperCase()
                
                stateElement.addEventListener('mouseenter', () => setHoveredState(stateId))
                stateElement.addEventListener('mouseleave', () => setHoveredState(null))
                stateElement.addEventListener('click', () => onStateClick?.(stateId))
                stateElement.style.cursor = 'pointer'
                
                // Add visible borders with !important to override SVG styles
                stateElement.style.setProperty('stroke', '#374151', 'important')
                stateElement.style.setProperty('stroke-width', '2', 'important')
                stateElement.style.setProperty('stroke-linejoin', 'round', 'important')
                stateElement.style.setProperty('stroke-linecap', 'round', 'important')
                stateElement.style.setProperty('stroke-opacity', '1', 'important')
              }
            })
            
            // Calculate state positions for overlay system
            const positions: Record<string, { x: number, y: number, width: number, height: number }> = {}
            northeastStates.forEach(stateId => {
              const stateClass = stateId.toLowerCase()
              const stateElement = svgElement.querySelector(`.${stateClass}`)
              if (stateElement) {
                const bbox = stateElement.getBBox()
                positions[stateId] = {
                  x: bbox.x,
                  y: bbox.y,
                  width: bbox.width,
                  height: bbox.height
                }
              }
            })
            setStatePositions(positions)
            
            // Mark SVG as loaded with a small delay to ensure DOM is ready
            setTimeout(() => {
              setSvgLoaded(true)
              console.log('🚀 SVG loaded with state positions calculated')
            }, 100)
          }
        }
      })
      .catch(error => {
        console.error('Error loading SVG:', error)
      })
  }, [onStateClick])

  // Simple SVG color updates - no highlighting in SVG (React overlay handles that)
  useEffect(() => {
    if (!svgLoaded) return

    const timer = setTimeout(() => {
      if (!containerRef.current) return

      const svgElement = containerRef.current.querySelector('svg')
      if (!svgElement) return

      console.log(`🎨 Updating SVG colors (no highlighting) for renderKey ${renderKey}`)

      // Update states - including yellow highlighting as backup
      northeastStates.forEach(stateId => {
        const stateClass = stateId.toLowerCase()
        const stateElements = svgElement.querySelectorAll(`.${stateClass}`)
        
        let color = '#ffffff' // default white
        
        if (correctStates.includes(stateId)) {
          color = '#10b981' // green
        } else if (incorrectStates.includes(stateId)) {
          color = '#ef4444' // red
        } else if (highlightedState === stateId) {
          color = '#ffff00' // bright yellow - backup highlighting
          console.log(`⭐ Setting ${stateId} to YELLOW in SVG as backup`)
        }
        
        stateElements.forEach((element: any) => {
          element.setAttribute('fill', color)
          element.style.fill = color
          element.setAttribute('stroke', '#374151')
          element.setAttribute('stroke-width', '2')
          element.setAttribute('stroke-opacity', '1')
        })
      })
    }, 50)

    return () => clearTimeout(timer)
  }, [svgLoaded, highlightedState, correctStates, incorrectStates, renderKey])

  return (
    <div className="w-full h-full" key={`map-${renderKey}`}>
      <div className="relative bg-gradient-to-b from-sky-100 to-blue-200 rounded-lg border-2 border-gray-300 shadow-lg p-2 h-full">
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden relative"
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
          
          {/* Simplified yellow highlight overlay - just show it in center for now */}
          {highlightedState && (
            <div
              className="absolute pointer-events-none animate-pulse z-10 bg-yellow-400 bg-opacity-70 border-2 border-yellow-500 rounded flex items-center justify-center font-bold text-black"
              style={{
                left: '50%',
                top: '20%',
                width: '120px',
                height: '40px',
                transform: 'translate(-50%, -50%)'
              }}
            >
              Find {highlightedState}!
            </div>
          )}
          
          {/* Debug info */}
          {highlightedState && (
            <div className="absolute top-2 left-2 bg-black text-white p-2 text-xs z-20">
              Highlighting: {highlightedState}
              <br />
              Has positions: {statePositions[highlightedState] ? 'Yes' : 'No'}
              <br />
              Position: {statePositions[highlightedState] ? `${Math.round(statePositions[highlightedState].x)}, ${Math.round(statePositions[highlightedState].y)}` : 'None'}
            </div>
          )}
          
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