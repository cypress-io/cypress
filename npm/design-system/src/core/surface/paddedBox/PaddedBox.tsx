import * as React from 'react'
import type { CSSProperties } from 'react'
import cs from 'classnames'

import type { Spacing } from 'css'
import type { CoreComponent } from 'core/shared'
import { paddingClass } from 'css/derived/util'

export interface PaddedBoxProps extends CoreComponent, React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  style?: CSSProperties

  /**
   * Defaults to 'm'
   */
  padding?: Spacing
}

export const PaddedBox: React.FC<PaddedBoxProps> = ({ className, style, padding, children, ...props }) => (
  <div {...props} className={cs(paddingClass(padding ?? 'm'), className)} style={style}>
    {children}
  </div>
)
