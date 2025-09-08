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
  
  // Refs to track previous state arrays for comparison
  const prevCorrectStatesRef = useRef<string[]>([])
  const prevIncorrectStatesRef = useRef<string[]>([])


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
        }
      }
    }
  }

  // Track SVG load state and force updates
  const [svgLoaded, setSvgLoaded] = useState(false)
  const [lastHighlightedState, setLastHighlightedState] = useState<string | undefined>()
  // Track state positions for React-controlled highlighting
  const [statePositions, setStatePositions] = useState<Record<string, { x: number, y: number, width: number, height: number }>>({})

  // Track highlighted state changes for logging
  useEffect(() => {
    if (highlightedState !== lastHighlightedState) {
      // Special logging for problematic transitions
      if (lastHighlightedState && !highlightedState) {
      }
      
      setLastHighlightedState(highlightedState)
      // Don't apply immediate updates - let the main color effect handle it
    }
  }, [highlightedState, lastHighlightedState, correctStates, incorrectStates])

  // Load and setup SVG when component mounts
  useEffect(() => {
    if (svgLoaded) {
      return
    }
    
    fetch('/map.svg')
      .then(response => {
        return response.text()
      })
      .then(svgText => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svgText
          
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            // Make SVG responsive
            svgElement.setAttribute('width', '100%')
            svgElement.setAttribute('height', '100%')
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

            // Add CSS to completely disable all tooltips on this SVG
            const style = document.createElement('style')
            style.textContent = `
              svg * {
                pointer-events: auto !important;
              }
              svg *[title]:after,
              svg *[aria-label]:after,
              svg title,
              svg desc {
                display: none !important;
                visibility: hidden !important;
              }
            `
            document.head.appendChild(style)

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
            }
            
            // Remove ALL title elements from the entire SVG to prevent cheating (do this last)
            const allTitleElements = svgElement.querySelectorAll('title')
            console.log(`Found ${allTitleElements.length} title elements to remove`)
            allTitleElements.forEach((titleEl, index) => {
              console.log(`Removing title ${index + 1}: "${titleEl.textContent}" (id: ${titleEl.id})`)
              titleEl.remove()
            })
            
            // Also remove desc elements which can also show tooltips
            const allDescElements = svgElement.querySelectorAll('desc')
            console.log(`Found ${allDescElements.length} desc elements to remove`)
            allDescElements.forEach(descEl => descEl.remove())
            
            // Also remove any aria-labelledby attributes that might reference titles
            const allElements = svgElement.querySelectorAll('*')
            allElements.forEach(el => {
              if (el.hasAttribute('aria-labelledby')) {
                el.removeAttribute('aria-labelledby')
              }
              if (el.hasAttribute('aria-describedby')) {
                el.removeAttribute('aria-describedby')
              }
            })
            
            // Force remove any remaining tooltip-related attributes
            const allPaths = svgElement.querySelectorAll('path')
            allPaths.forEach(path => {
              path.removeAttribute('title')
              path.removeAttribute('aria-label')
              path.removeAttribute('data-title')
              path.removeAttribute('data-original-title')
              // Remove any child title elements that might have been missed
              const childTitles = path.querySelectorAll('title')
              childTitles.forEach(title => title.remove())
            })
            
            // Add a global style to the SVG element itself to disable tooltips
            svgElement.style.setProperty('pointer-events', 'auto', 'important')
            svgElement.setAttribute('aria-hidden', 'true')
            
            // Double-check removal worked
            const remainingTitles = svgElement.querySelectorAll('title')
            const remainingDescs = svgElement.querySelectorAll('desc')
            console.log(`After removal, ${remainingTitles.length} title elements and ${remainingDescs.length} desc elements remain`)
            
            // Log any elements that still have tooltip-related attributes
            const elementsWithTooltips = svgElement.querySelectorAll('[title], [aria-label], [aria-labelledby], [aria-describedby]')
            if (elementsWithTooltips.length > 0) {
              console.warn(`Warning: ${elementsWithTooltips.length} elements still have tooltip attributes:`, elementsWithTooltips)
            }
            
            // Mark SVG as loaded with a small delay to ensure DOM is ready
            setTimeout(() => {
              setSvgLoaded(true)
            }, 100)
          }
        }
      })
      .catch(error => {
        console.error('Error loading SVG:', error)
      })
  }, [svgLoaded]) // Only reload if svgLoaded changes

  // Robust SVG color updates - only change what needs changing
  useEffect(() => {
    if (!svgLoaded) return

    // Special handling for when highlight is cleared but we have game progress
    const hasGameProgress = correctStates.length > 0 || incorrectStates.length > 0
    const highlightCleared = !highlightedState || highlightedState.trim() === ""
    
    // Only skip updates if highlight is cleared AND the state arrays haven't changed
    // This prevents color wipes when just the highlight changes, but allows updates when game state changes
    const stateArraysChanged = 
      JSON.stringify(correctStates) !== JSON.stringify(prevCorrectStatesRef.current) ||
      JSON.stringify(incorrectStates) !== JSON.stringify(prevIncorrectStatesRef.current)
    
    if (hasGameProgress && highlightCleared && !stateArraysChanged) {
      return // Don't update colors at all when highlight is cleared during active game
    }
    
    // Update the refs for next comparison
    prevCorrectStatesRef.current = [...correctStates]
    prevIncorrectStatesRef.current = [...incorrectStates]

    // Also check if this is a fresh SVG load but we have game progress - preserve colors
    if (hasGameProgress && !lastHighlightedState && !highlightedState) {
      // Allow the color update to proceed to restore the correct colors
    }

    const updateColors = () => {
      if (!containerRef.current) {
        return false
      }
      const svgElement = containerRef.current.querySelector('svg')
      if (!svgElement) {
        return false
      }

      let changesApplied = 0
      let whitedOut = 0
      
      // Process each northeast state
      northeastStates.forEach(stateId => {
        const stateClass = stateId.toLowerCase()
        const stateElements = svgElement.querySelectorAll(`.${stateClass}`)
        
        if (stateElements.length === 0) {
          return
        }

        // Determine what color and priority this state should have
        let targetColor = '#ffffff' // default white
        let targetPriority = 0
        
        // PRIORITY ORDER: Yellow (highlighted) > Green (correct) > Red (incorrect) > White (default)
        if (highlightedState && highlightedState === stateId) {
          targetColor = '#ffff00' // bright yellow - HIGHEST priority
          targetPriority = 3
        } else if (correctStates.includes(stateId)) {
          targetColor = '#10b981' // green - second priority
          targetPriority = 1
        } else if (incorrectStates.includes(stateId)) {
          targetColor = '#ef4444' // red - third priority
          targetPriority = 2
        } else {
          if (targetColor === '#ffffff') {
            whitedOut++
          }
        }
        
        // Apply color to all elements for this state
        stateElements.forEach((element) => {
          const svgElement = element as SVGPathElement
          
          // Check current state
          const currentPriority = parseInt(svgElement.dataset.colorPriority || '0')
          const currentFill = svgElement.getAttribute('fill')
          
          // Only update if something actually needs to change
          if (currentPriority !== targetPriority || currentFill !== targetColor) {
            // Update the element
            svgElement.dataset.colorPriority = targetPriority.toString()
            svgElement.setAttribute('fill', targetColor)
            svgElement.setAttribute('stroke', '#374151')
            svgElement.setAttribute('stroke-width', '2')
            svgElement.setAttribute('stroke-opacity', '1')
            
            // Apply CSS styles as backup
            svgElement.style.setProperty('fill', targetColor, 'important')
            svgElement.style.setProperty('stroke', '#374151', 'important')
            svgElement.style.setProperty('stroke-width', '2px', 'important')
            svgElement.style.setProperty('stroke-opacity', '1', 'important')
            
            changesApplied++
          }
        })
      })
      
      console.log(`✅ Color update complete at ${new Date().toISOString()}`)
      console.log(`📈 Applied ${changesApplied} changes, ${whitedOut} states set to white`)
      
      // Alert if many states are being whitened - this indicates a problem
      if (whitedOut > 5) {
        console.warn(`� WARNING: ${whitedOut} states being set to white - possible color wipe!`)
        console.warn(`🚨 Current state: highlighted="${highlightedState}", correct=[${correctStates.join(',')}], incorrect=[${incorrectStates.join(',')}]`)
      }
      
      return true
    }

    // Simple update with a small delay to ensure React state has settled
    const timer = setTimeout(() => {
      updateColors()
    }, 10)
    
    return () => clearTimeout(timer)
  }, [svgLoaded, highlightedState, correctStates, incorrectStates])

  return (
    <div className="w-full h-full">
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