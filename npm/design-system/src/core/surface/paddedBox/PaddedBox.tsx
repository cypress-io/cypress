import * as React from 'react'
import cs from 'classnames'

import { Spacing } from '../../../css'

export interface PaddedBoxProps {
  className?: string

  /**
   * Defaults to 'm'
   */
  padding?: Spacing
}

export const PaddedBox: React.FC<PaddedBoxProps> = ({ className, padding, children }) => (
  <div className={cs(`padding-${padding ?? 'm'}`, className)}>
    {children}
  </div>
)
