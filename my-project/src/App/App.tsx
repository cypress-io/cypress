import React, { useState } from 'react'
import { Canvas } from '../Canvas'
import { ColorPalette } from '../ColorPalette'
import { Toolbar, Shape } from '../Toolbar'
import './index.css'

export const App: React.FC = props => {
  const [shape, setShape] = useState<Shape>('pen')
  const [color, setColor] = useState('black')

  return (
    <React.Fragment>
      <Toolbar
        onSelectShape={setShape}
      />

      <div className='cy-draw__body'>
        <Canvas
          shape={shape}
          color={color}
        />

        <div className='cy-draw__palette-wrapper'>
          <ColorPalette
            selectedColor={color}
            onSelectColor={setColor}
          />
        </div>
      </div>
    </React.Fragment>
  )
}