import * as React from 'react'
import cs from 'classnames'

import { Spacing } from '../../../css'

export interface PaddedBoxProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  className?: string

  /**
   * Defaults to 'm'
   */
  padding?: Spacing
}

export const PaddedBox: React.FC<PaddedBoxProps> = ({ className, padding, children, ...props }) => (
  <div {...props} className={cs(`padding-${padding ?? 'm'}`, className)}>
    {children}
  </div>
)
