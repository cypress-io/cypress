import React, { CSSProperties } from 'react'
import cs from 'classnames'
import { IconName } from '@fortawesome/fontawesome-common-types'

import { TextSizableComponent } from 'core/shared'
import { StyledText } from 'core/text/styledText'
import { Icon, IconProps } from 'core/icon/Icon'

import styles from './CollapsibleGroup.module.scss'

export interface IconInfo {
  expanded: IconName
  collapsed: IconName
  iconProps?: Omit<IconProps, 'icon'>
}

export interface CollapsibleGroupHeaderProps extends TextSizableComponent {
  style?: CSSProperties

  title: string | JSX.Element
  tooltipTitle?: string

  /**
   * The icons to render for expanded and collapsed states. If not specified, no icons will be rendered
   */
  icons?: IconInfo

  expanded: boolean
  disabled?: boolean

  onClick?: () => void
}

export const CollapsibleGroupHeader: React.FC<CollapsibleGroupHeaderProps> = ({
  className,
  style,
  title,
  tooltipTitle,
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
      className,
    ])}
    style={style}
    title={tooltipTitle ? tooltipTitle : typeof title === 'string' ? title : undefined}
    size={size}
    lineHeight={lineHeight}
    onClick={onClick}
  >
    {icons && <Icon {...icons.iconProps} icon={expanded ? icons.expanded : icons.collapsed} />}
    <div className={styles.title}>
      {title}
    </div>
  </StyledText>
)
