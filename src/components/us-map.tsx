"use client"

import { useState, useRef, useEffect } from "react"

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
      ? Math.max(0.8, zoom - zoomFactor) // Minimum zoom increased since we're focused on NE
      : Math.min(4, zoom + zoomFactor)   // Maximum zoom increased for better detail
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
    
    // Reset viewBox to Northeast region if SVG is loaded
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg')
      if (svgElement && Object.keys(statePositions).length > 0) {
        // Recalculate Northeast bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        
        Object.values(statePositions).forEach(pos => {
          minX = Math.min(minX, pos.x)
          minY = Math.min(minY, pos.y)
          maxX = Math.max(maxX, pos.x + pos.width)
          maxY = Math.max(maxY, pos.y + pos.height)
        })
        
        if (minX !== Infinity) {
          const padding = 20
          const neWidth = maxX - minX + (padding * 2)
          const neHeight = maxY - minY + (padding * 2)
          const neX = minX - padding
          const neY = minY - padding
          
          svgElement.setAttribute('viewBox', `${neX} ${neY} ${neWidth} ${neHeight}`)
          console.log('🔄 Reset to Northeast view')
        }
      }
    }
  }

  // Track SVG load state and force updates
  const [svgLoaded, setSvgLoaded] = useState(false)
  const [lastHighlightedState, setLastHighlightedState] = useState<string | undefined>()
  // Track state positions for React-controlled highlighting
  const [statePositions, setStatePositions] = useState<Record<string, { x: number, y: number, width: number, height: number }>>({})

  // Force re-render when highlighted state changes
  useEffect(() => {
    if (highlightedState !== lastHighlightedState) {
      console.log(`🔄 Highlighted state changed: ${lastHighlightedState} → ${highlightedState}`)
      setLastHighlightedState(highlightedState)
      
      // Force immediate update if SVG is already loaded
      if (svgLoaded && containerRef.current) {
        const svgElement = containerRef.current.querySelector('svg')
        if (svgElement && highlightedState) {
          // Immediate highlight application with retry
          const applyImmediateHighlight = () => {
            const targetElements = svgElement.querySelectorAll(`.${highlightedState.toLowerCase()}`)
            if (targetElements.length > 0) {
              console.log(`⚡ Applying immediate highlight to ${highlightedState}`)
              targetElements.forEach((element) => {
                const svgElement = element as SVGPathElement
                // Clear any existing conflicting styles
                svgElement.removeAttribute('style')
                svgElement.removeAttribute('fill')
                
                // Apply yellow highlighting immediately
                svgElement.style.setProperty('fill', '#ffff00', 'important')
                svgElement.style.setProperty('stroke', '#374151', 'important')
                svgElement.style.setProperty('stroke-width', '2px', 'important')
                svgElement.setAttribute('fill', '#ffff00')
              })
            } else {
              console.warn(`⚠️ No elements found for immediate highlight of ${highlightedState}`)
            }
          }
          
          // Apply immediately and also with a small delay as backup
          applyImmediateHighlight()
          setTimeout(applyImmediateHighlight, 10)
        }
      }
    }
  }, [highlightedState, lastHighlightedState, svgLoaded])

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
              const htmlElement = stateElement as HTMLElement
              const svgElement = stateElement as SVGElement
              const stateClass = stateElement.getAttribute('class')
              if (stateClass && !northeastStates.some(ne => stateClass === ne.toLowerCase())) {
                // Hide non-northeast states
                htmlElement.style.display = 'none'
              } else if (stateClass && northeastStates.some(ne => stateClass === ne.toLowerCase())) {
                // Set up northeast states
                const stateId = stateClass.toUpperCase()
                
                stateElement.addEventListener('mouseenter', () => setHoveredState(stateId))
                stateElement.addEventListener('mouseleave', () => setHoveredState(null))
                stateElement.addEventListener('click', () => onStateClick?.(stateId))
                htmlElement.style.cursor = 'pointer'
                
                // Add visible borders with !important to override SVG styles
                htmlElement.style.setProperty('stroke', '#374151', 'important')
                htmlElement.style.setProperty('stroke-width', '2', 'important')
                htmlElement.style.setProperty('stroke-linejoin', 'round', 'important')
                htmlElement.style.setProperty('stroke-linecap', 'round', 'important')
                htmlElement.style.setProperty('stroke-opacity', '1', 'important')
              }
            })
            
            // Calculate state positions and create focused viewBox for Northeast region
            const positions: Record<string, { x: number, y: number, width: number, height: number }> = {}
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
            
            northeastStates.forEach(stateId => {
              const stateClass = stateId.toLowerCase()
              const stateElement = svgElement.querySelector(`.${stateClass}`) as SVGGraphicsElement
              if (stateElement && stateElement.getBBox) {
                const bbox = stateElement.getBBox()
                positions[stateId] = {
                  x: bbox.x,
                  y: bbox.y,
                  width: bbox.width,
                  height: bbox.height
                }
                
                // Track the overall bounding box of all Northeast states
                minX = Math.min(minX, bbox.x)
                minY = Math.min(minY, bbox.y)
                maxX = Math.max(maxX, bbox.x + bbox.width)
                maxY = Math.max(maxY, bbox.y + bbox.height)
              }
            })
            setStatePositions(positions)
            
            // Set viewBox to focus on Northeast region with some padding
            if (minX !== Infinity) {
              const padding = 20 // Add some padding around the region
              const neWidth = maxX - minX + (padding * 2)
              const neHeight = maxY - minY + (padding * 2)
              const neX = minX - padding
              const neY = minY - padding
              
              svgElement.setAttribute('viewBox', `${neX} ${neY} ${neWidth} ${neHeight}`)
              console.log(`🔍 Set viewBox to focus on Northeast: ${neX} ${neY} ${neWidth} ${neHeight}`)
              console.log(`📍 Northeast region bounds: x=${minX}-${maxX}, y=${minY}-${maxY}`)
            }
            
            // Mark SVG as loaded with a small delay to ensure DOM is ready
            setTimeout(() => {
              setSvgLoaded(true)
              console.log('🚀 SVG loaded with state positions calculated and zoomed to Northeast')
              console.log(`📊 Found ${Object.keys(positions).length} northeast states in SVG`)
            }, 100)
          }
        }
      })
      .catch(error => {
        console.error('Error loading SVG:', error)
      })
  }, [onStateClick])

  // Robust SVG color updates with better error handling
  useEffect(() => {
    if (!svgLoaded) return

    const updateColors = () => {
      if (!containerRef.current) return
      const svgElement = containerRef.current.querySelector('svg')
      if (!svgElement) return

      console.log(`🎨 Updating colors for renderKey ${renderKey}, highlighting: "${highlightedState}"`)
      
      // Process each state with priority-based coloring
      northeastStates.forEach(stateId => {
        const stateClass = stateId.toLowerCase()
        const stateElements = svgElement.querySelectorAll(`.${stateClass}`)
        
        if (stateElements.length === 0) {
          console.warn(`⚠️ No elements found for state: ${stateId}`)
          return
        }

        // Determine color with clear priority order
        let color = '#ffffff' // default white
        let priority = 0
        
        if (correctStates.includes(stateId)) {
          color = '#10b981' // green
          priority = 1
        } else if (incorrectStates.includes(stateId)) {
          color = '#ef4444' // red  
          priority = 2
        } else if (highlightedState === stateId) {
          color = '#ffff00' // bright yellow - highest priority
          priority = 3
          console.log(`⭐ Setting ${stateId} to YELLOW (priority ${priority})`)
        }
        
        // Apply styling to all elements for this state
        stateElements.forEach((element) => {
          const svgElement = element as SVGPathElement
          // Store the priority to avoid conflicts
          svgElement.dataset.colorPriority = priority.toString()
          
          // Comprehensive style clearing
          svgElement.removeAttribute('style')
          svgElement.removeAttribute('fill')
          svgElement.style.cssText = '' // Clear any existing CSS
          
          // Apply new styles with multiple methods for maximum compatibility
          svgElement.setAttribute('fill', color)
          svgElement.setAttribute('stroke', '#374151')
          svgElement.setAttribute('stroke-width', '2')
          svgElement.setAttribute('stroke-opacity', '1')
          
          // Force with CSS - use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            svgElement.style.setProperty('fill', color, 'important')
            svgElement.style.setProperty('stroke', '#374151', 'important')
            svgElement.style.setProperty('stroke-width', '2px', 'important')
            svgElement.style.setProperty('stroke-opacity', '1', 'important')
          })
          
          console.log(`  → ${stateId} set to ${color} (priority: ${priority})`)
        })
      })
    }

    // Multiple update attempts with increasing delays for reliability
    const updateWithRetry = () => {
      updateColors()
      
      // If we have a highlighted state, verify it was applied and retry if needed
      if (highlightedState) {
        const verifyAndRetry = (attempt: number = 1) => {
          if (attempt > 3) return // Max 3 attempts
          
          setTimeout(() => {
            const svgElement = containerRef.current?.querySelector('svg')
            if (!svgElement) return
            
            const targetElements = svgElement.querySelectorAll(`.${highlightedState.toLowerCase()}`)
            if (targetElements.length === 0) return
            
            const element = targetElements[0] as SVGPathElement
            const computedStyle = window.getComputedStyle(element)
            const actualFill = computedStyle.fill
            const isYellow = actualFill === 'rgb(255, 255, 0)' || actualFill === '#ffff00' || actualFill === 'yellow'
            
            if (!isYellow) {
              console.log(`🔧 Retry ${attempt}: ${highlightedState} not yellow (${actualFill}), retrying...`)
              
              // Force a more aggressive update
              targetElements.forEach((el) => {
                const svgEl = el as SVGPathElement
                svgEl.style.cssText = ''
                svgEl.removeAttribute('fill')
                // Use requestAnimationFrame for better timing
                requestAnimationFrame(() => {
                  svgEl.style.setProperty('fill', '#ffff00', 'important')
                  svgEl.style.setProperty('stroke', '#374151', 'important')
                  svgEl.style.setProperty('stroke-width', '2px', 'important')
                  svgEl.setAttribute('fill', '#ffff00')
                })
              })
              
              // Try again if still not working
              verifyAndRetry(attempt + 1)
            } else {
              console.log(`✅ ${highlightedState} successfully highlighted yellow on attempt ${attempt}`)
            }
          }, attempt * 150) // Increasing delays: 150ms, 300ms, 450ms
        }
        
        verifyAndRetry()
      }
    }

    // Initial update with small delay
    const timer = setTimeout(updateWithRetry, 50)
    
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
          
          
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setZoom(prev => Math.min(4, prev + 0.2))}
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
            onClick={() => setZoom(prev => Math.max(0.8, prev - 0.2))}
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