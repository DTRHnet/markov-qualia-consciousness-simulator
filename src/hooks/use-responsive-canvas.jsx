import * as React from "react"

const ARENA_W = 1200
const ARENA_H = 800

export function useResponsiveCanvas(canvasRef) {
  const [scale, setScale] = React.useState(1)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      if (!container) return

      // Get the container's actual width
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Calculate scale to fit the arena into the container
      const scaleX = containerWidth / ARENA_W
      const scaleY = containerHeight / ARENA_H
      const newScale = Math.min(scaleX, scaleY, 1) // Don't upscale on desktop

      // Set canvas resolution to match device pixel ratio
      const dpr = window.devicePixelRatio || 1
      canvas.width = ARENA_W * dpr
      canvas.height = ARENA_H * dpr

      // Scale the canvas context to account for DPR
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      // Set CSS size for display
      canvas.style.width = `${ARENA_W * newScale}px`
      canvas.style.height = `${ARENA_H * newScale}px`

      setScale(newScale)
    }

    // Initial size
    updateCanvasSize()

    // Watch for resize
    const container = canvas.parentElement
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(container)

    // Also listen to window resize
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [canvasRef])

  return scale
}
