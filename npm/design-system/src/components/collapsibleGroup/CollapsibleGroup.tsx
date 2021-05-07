import cs from 'classnames'
import React, { useLayoutEffect, useState } from 'react'

import { CollapsibleGroupHeader, CollapsibleGroupHeaderProps } from './CollapsibleGroupHeader'
import { TextSizableComponent } from 'core/shared'

import styles from './CollapsibleGroup.module.scss'

interface CollapsibleGroupProps
  extends Omit<CollapsibleGroupHeaderProps, 'expanded' | 'onClick'>,
    TextSizableComponent {
  style?: React.CSSProperties

  title: string | JSX.Element

  expanded?: boolean
  defaultExpanded?: boolean
  onToggle?: (isExpanded: boolean) => void

  disable?: boolean
}

export const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  className,
  style,
  expanded: externalExpanded,
  defaultExpanded = externalExpanded,
  onToggle,
  children,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(!!defaultExpanded)

  useLayoutEffect(() => {
    if (externalExpanded !== undefined) {
      setIsExpanded(externalExpanded)
    }
  }, [externalExpanded])

  return (
    <div className={cs([{ [styles.expanded]: isExpanded }, styles.group, className])} style={style}>
      <CollapsibleGroupHeader
        {...props}
        expanded={isExpanded}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={() => {
          onToggle?.(!isExpanded)

          setIsExpanded((expanded) => !expanded)
        }}
      />
      <div className={styles.content}>{isExpanded && children}</div>
    </div>
  )
}
