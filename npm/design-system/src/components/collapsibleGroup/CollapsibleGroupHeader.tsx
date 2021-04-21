import React from 'react'
import cs from 'classnames'

import { TextSizableComponent } from '../../core/shared'
import { StyledText } from '../../core/text/StyledText'

import styles from './CollapsibleGroup.module.scss'
import { Icon } from '../../core/icon/Icon'
import { IconName } from '@fortawesome/fontawesome-common-types'

export interface CollapsibleGroupHeaderProps extends TextSizableComponent {
  title: string | JSX.Element

  /**
   * The icons to render for expanded and collapsed states. If not specified, no icons will be rendered
   */
  icons?: {
    expanded: IconName
    collapsed: IconName
  }

  expanded: boolean
  disabled?: boolean

  onClick?: () => void
}

export const CollapsibleGroupHeader: React.FC<CollapsibleGroupHeaderProps> = ({
  title,
  expanded,
  disabled,
  size,
  lineHeight,
  icons,
  onClick,
}) => (
  <StyledText
    className={cs([
      styles.header,
      { [styles.expanded]: expanded, [styles.disabled]: disabled },
    ])}
    size={size}
    lineHeight={lineHeight}
    onClick={onClick}
  >
    {icons && <Icon icon={expanded ? icons.expanded : icons.collapsed} />}
    <div className={styles.title}>
      {title}
    </div>
  </StyledText>
)
