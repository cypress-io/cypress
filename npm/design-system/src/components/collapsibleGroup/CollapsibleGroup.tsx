import cs from 'classnames'
import React, { useLayoutEffect, useState } from 'react'

import { CollapsibleGroupHeader } from './CollapsibleGroupHeader'

import styles from './CollapsibleGroup.module.scss'
import { TextSizableComponent } from '../../core/shared'

interface CollapsibleGroupProps extends TextSizableComponent {
  style?: React.CSSProperties

  title: string | JSX.Element

  expanded?: boolean
  defaultExpanded?: boolean
  onToggle?: (isExpanded: boolean) => void

  disable?: boolean
}

export const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  title,
  expanded: externalExpanded,
  defaultExpanded = externalExpanded,
  onToggle,
  disable,
  className,
  style,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded)

  useLayoutEffect(() => {
    if (externalExpanded !== undefined) {
      setIsExpanded(externalExpanded)
    }
  }, [externalExpanded])

  return (
    <div
      className={cs([
        { [styles.expanded]: isExpanded },
        styles.group,
        className,
      ])}
      style={style}
    >
      <CollapsibleGroupHeader
        title={title}
        expanded={isExpanded}
        disabled={disable}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          onToggle?.(!isExpanded)

          setIsExpanded((expanded) => !expanded)
        }}
      />
      <div className={styles.content}>
        {isExpanded && children}
      </div>
    </div>
  )
}
