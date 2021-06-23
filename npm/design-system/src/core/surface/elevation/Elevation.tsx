import * as React from 'react'
import cs from 'classnames'

import type { SurfaceElevation } from 'css'

export interface ElevationProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  className?: string

  /**
   * Defaults to 'flat'
   */
  elevation?: SurfaceElevation
}

export const Elevation: React.FC<ElevationProps> = ({ className, elevation, children, ...props }) => (
  <div {...props} className={cs(`depth-${elevation ?? 'flat'}`, className)}>
    {children}
  </div>
)
