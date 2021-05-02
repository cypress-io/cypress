import * as React from 'react'
import cs from 'classnames'

import styles from './Baseline.module.scss'

export interface BaselineProps {
  className?: string
}

export const Baseline: React.FC<BaselineProps> = ({ className, children }) => (
  <div className={cs(styles.baseline, className)}>
    {children}
  </div>
)
