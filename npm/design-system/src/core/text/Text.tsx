import * as React from 'react'
import cs from 'classnames'

import { LineHeight, TextSize } from '../../css'

export interface TextProps {
  className?: string

  size: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight
}

export const Text: React.FC<TextProps> = ({ className, size, lineHeight, children }) => {
  return (
    <span className={cs(textSizeToClassName(size), lineHeightToClassName(lineHeight ?? 'normal'), className)}>
      {children}
    </span>
  )
}

const textSizeToClassName = (size: TextSize): string => `text-${size}`

const lineHeightToClassName = (lineHeight: LineHeight): string => `line-height-${lineHeight}`
