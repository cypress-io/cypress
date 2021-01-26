import React, { CSSProperties, useRef, useState } from 'react'
import { Shape } from '../Toolbar'
import './index.css'

interface CanvasProps {
  shape: Shape
}

const contextDefaults: Partial<Record<keyof CanvasRenderingContext2D, string>> = {
  lineWidth: '2',
  lineCap: 'round',
  strokeStyle: 'black'
}

export const Canvas: React.FC<CanvasProps> = props => {
  const mainRef = useRef<HTMLCanvasElement>(null)
  const tempRef = useRef<HTMLCanvasElement>(null)
  const [points, setPoints] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [tempStyle, setStyle] = useState<CSSProperties>({
    left: -5000
  })

  const onMouseDown = (e: React.MouseEvent) => {
    setStyle({ left: 0 })
    setDrawing(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drawing) {
      return
    }

    const ctx = mainRef.current.getContext('2d')

    ctx.lineTo(e.clientX, e.clientY)
		ctx.stroke()
    ctx.beginPath()
    setPoints([...points, { x: e.clientX, y: e.clientY }])
		ctx.fill()
		ctx.beginPath();
		ctx.moveTo(e.clientX, e.clientY);
  }

  const onMouseUp = (e: React.MouseEvent) => {
    const tempCtx = tempRef.current.getContext('2d')
    tempCtx.clearRect(0, 0, tempRef.current.width, tempRef.current.height)
    setDrawing(false)
    setPoints([])
    setStyle({ left: -5000 })
  }

  return (
    <div className='cy-draw__wrapper'>
      <canvas
        ref={mainRef}
        id='cy-draw__main--canvas'
        height='300'
        width='300'
        onMouseDown={onMouseDown}
      />

      <canvas
        ref={tempRef}
        id='cy-draw__temp--canvas'
        height='300'
        width='300'
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={tempStyle}
      />
    </div>
  )
}