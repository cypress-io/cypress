import * as React from 'react'
import { TextSize } from '../../css'

export interface TextProps {
  size: TextSize
}

export const Text: React.FC<TextProps> = ({ size, children }) => {
  return (
    <span>
      {children}
    </span>
  )
}
