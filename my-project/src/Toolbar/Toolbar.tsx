import React from 'react'
import './index.css'

export type Shape = 'rect' | 'pen'

interface ToolbarProps {
  selectedShape: Shape
  selectedColor: string
  onSelectShape: (shape: Shape) => void
}

const shapes = 'pen rect'.split(' ') as Shape[]

const capitalize = (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1, str.length)

export const Toolbar: React.FC<ToolbarProps> = props => {
  const Shape = (shape: Shape) => (
    <button
      className='cy-draw__toolbar--button'
      style={{
        border: `2px solid ${shape === props.selectedShape ? props.selectedColor : 'grey'}`
      }}
      
      onClick={() => props.onSelectShape(shape)}
    >
      {capitalize(shape)}
    </button>
  )

  return (
    <div className='cy-draw__toolbar'>
      {shapes.map(Shape)}
    </div>
  )
}
