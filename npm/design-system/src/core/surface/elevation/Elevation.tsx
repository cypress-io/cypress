import * as React from 'react'
import cs from 'classnames'

import { SurfaceElevation } from '../../../css'

export interface ElevationProps {
  className?: string

  /**
   * Defaults to 'flat'
   */
  elevation?: SurfaceElevation
}

export const Elevation: React.FC<ElevationProps> = ({ className, elevation, children }) => (
  <div className={cs(`depth-${elevation ?? 'flat'}`, className)}>
    {children}
  </div>
)
