import React from 'react'
import './index.css'

interface ColorPaletteProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

const colors = 'red blue green yellow pink purple black orange white'.split(' ')

export const ColorPalette: React.FC<ColorPaletteProps> = props => {
  const Color = (color: string) => (
    <button
      className={`
        cy-draw__palette--button 
        ${props.selectedColor === color ? 'cy-draw__palette--button--selected' : ''}
      `}
      name={color}
      style={{ background: color }}
      onClick={() => props.onSelectColor(color)}
    />
  )

  return (
    <div className='cy-draw__palette'>
      {colors.map(Color)}
    </div>
  )
}