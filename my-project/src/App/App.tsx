import React, { useRef, useState } from 'react'
import { Canvas } from '../Canvas'
import { ColorPalette } from '../ColorPalette'
import { Toolbar, Shape } from '../Toolbar'
import { HistoryNavigator } from '../HistoryNavigator'
import './index.css'

export type DrawingRecording = () => void

export const App: React.FC = props => {
  const [shape, setShape] = useState<Shape>('pen')
  const [color, setColor] = useState('black')
  const [history, setHistory] = useState<DrawingRecording[]>([])
  const [historyPosition, setHistoryPosition] = useState<number>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const recordHistory = (recording: DrawingRecording) => {
    if (historyPosition !== null && historyPosition !== history.length) {
      // we are mutating history part way through.
      // delete "the future" since we are now defining a new future.
      const forkedHistory = [...history.slice(0, historyPosition + 1), recording]
      redrawFromHistory(forkedHistory)
      setHistory(forkedHistory)
      setHistoryPosition(forkedHistory.length - 1)
      return
    } 

    const newHistory = [...history, recording]
    setHistory(newHistory)
    setHistoryPosition(newHistory.length - 1)
  }

  const redrawFromHistory = (history: DrawingRecording[]) => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    for (const drawingRecording of history) {
      drawingRecording()
    }
  }

  const gotoPosition = (index: number) => {
    setHistoryPosition(index)

    const slices = history.slice(0, index + 1)
    redrawFromHistory(slices)
  }

  return (
    <React.Fragment>
      <Toolbar
        selectedShape={shape}
        selectedColor={color}
        onSelectShape={setShape}
      />

      <div className='cy-draw__body'>
        <Canvas
          shape={shape}
          color={color}
          canvasRef={canvasRef}
          onFinishDrawingShape={recordHistory}
        />

        <div className='cy-draw__palette-wrapper'>
          <ColorPalette
            selectedColor={color}
            onSelectColor={setColor}
          />
        </div>
      </div>

      <HistoryNavigator 
        history={history}
        historyPosition={historyPosition}
        onGotoPosition={gotoPosition}
      />
    </React.Fragment>
  )
}