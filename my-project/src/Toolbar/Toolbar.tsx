import React from 'react'
import './index.css'

export type Shape = 'rect' | 'pen'

interface ToolbarProps {
  onSelectShape: (shape: Shape) => void
}

export const Toolbar: React.FC<ToolbarProps> = props => {
  return (
    <div className='cy-draw__toolbar'>
      <button
        className='cy-draw__toolbar--button'
        onClick={() => props.onSelectShape('rect')}
      >
        Rect
      </button>

      <button
        className='cy-draw__toolbar--button'
        onClick={() => props.onSelectShape('pen')}
      >
        Pen
      </button>
    </div>
  )
}