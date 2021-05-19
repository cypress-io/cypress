import { LineHeight, TextSize } from 'css'
import { ReactNode } from 'react'

export interface CoreComponent {
  className?: string
}

export interface SizingProps {
  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight
}

export type TextSizableComponent = CoreComponent & SizingProps

export type Label = {
    type: 'tag'
    contents: ReactNode
    labelClassName?: string
    size?: TextSize
    lineHeight?: LineHeight
  } | {
    type: 'aria'
    contents: string
}