import * as React from 'react'
import cs from 'classnames'

import { LineHeight, TextSize } from '../../css'

export interface StyledTextProps {
  className?: string

  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight
}

// Named "StyledText" instead of "Text" to avoid collision with top level React type
export const StyledText: React.FC<StyledTextProps> = ({ className, size, lineHeight, children }) => {
  return (
    <span className={cs(textSizeToClassName(size ?? 'm'), lineHeightToClassName(lineHeight ?? 'normal'), className)}>
      {children}
    </span>
  )
}

const textSizeToClassName = (size: TextSize): string => `text-${size}`

const lineHeightToClassName = (lineHeight: LineHeight): string => `line-height-${lineHeight}`
