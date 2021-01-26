import React from 'react'
import './index.css'

export type Shape = 'rect' | 'pen' | 'circle'

interface ToolbarProps {
  selectedShape: Shape
  selectedColor: string
  onSelectShape: (shape: Shape) => void
}

const shapes = 'pen rect circle'.split(' ') as Shape[]

const capitalize = (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1, str.length)

export const Toolbar: React.FC<ToolbarProps> = props => {
  const Shape = (shape: Shape) => {
    const selected = shape === props.selectedShape

    return (
      <button
        className='cy-draw__toolbar--button'
        key={shape}
        style={{
          border: `${selected ? 3 : 1}px solid ${selected ? 'darkblue' : 'grey'}`
        }}

        onClick={() => props.onSelectShape(shape)}
      >
        {capitalize(shape)}
      </button>
    )
  }

  return (
    <div className='cy-draw__toolbar'>
      {shapes.map(Shape)}
    </div>
  )
}
