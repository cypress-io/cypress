import React, { useState } from 'react'
import { Canvas } from '../Canvas'
import { Toolbar, Shape } from '../Toolbar'

export const App: React.FC = props => {
  const [shape, setShape] = useState<Shape>('pen')

  return (
    <React.Fragment>
      <Toolbar 
        onSelectShape={setShape}
      />

      <Canvas 
        shape={shape}
      />
    </React.Fragment>
  )
}