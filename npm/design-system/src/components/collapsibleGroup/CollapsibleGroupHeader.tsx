import React from 'react'
import cs from 'classnames'

import styles from './CollapsibleGroup.module.scss'

interface CollapsibleGroupHeaderProps {
  title: string | JSX.Element

  expanded: boolean
  disabled?: boolean

  onClick: () => void
}

export const CollapsibleGroupHeader: React.FC<CollapsibleGroupHeaderProps> = ({
  title,
  expanded,
  disabled,
  onClick,
}) => (
  <div
    className={cs([
      styles.header,
      { [styles.expanded]: expanded, [styles.disabled]: disabled },
    ])}
    onClick={onClick}
  >
    <div className={styles.title}>
      {title}
    </div>
  </div>
)
