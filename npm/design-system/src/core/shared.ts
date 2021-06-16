import { LineHeight, TextSize } from 'css'

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
