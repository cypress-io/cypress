import React, { useState } from 'react'
import { DrawingRecording } from '../App'
import './index.css'

interface HistoryNavigatorProps {
  history: DrawingRecording[] 
  historyPosition: null | number
  onGotoPosition: (position: number) => void
}

export const HistoryNavigator: React.FC<HistoryNavigatorProps> = props => {
  const HistorySlice = (index: number) => {
    const selected = props.historyPosition === index
    return (
      <button 
        key={index}
        className='cy-draw__history--button'
        style={{ border: `${selected ? 3 : 1}px solid ${selected ? 'darkblue' : 'black'}` }}
        role='history-step'
        name={`step-${index + 1}`}
        onClick={() => props.onGotoPosition(index)}
      >
        {index + 1}
      </button>
    )
  }

  return (
    <div role='history' className='cy-draw__history--wrapper'>
      <div className='cy-draw__history--header'>History</div>
      <div className='cy-draw__history--buttons'>
        {new Array(props.history.length).fill(0).map((x, idx) => HistorySlice(idx))}
      </div>
    </div>
  )
}
