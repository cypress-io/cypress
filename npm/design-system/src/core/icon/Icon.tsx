import * as React from 'react'
import { SVGAttributes } from 'react'
import cs from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { LineHeight, TextSize } from '../../css'
import { styledTextSizeClassNames } from '../text/StyledText'

import styles from './Icon.module.scss'

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'mask'> {
  className?: string

  // TODO: Limit literals to only those available in the iconset
  icon: IconName

  // TODO: Is there ever a need for the icon to not take a square space as long as it's properly centered?
  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight

  disableOffset?: boolean
}

// Currently only a passthrough for FontAwesome. This provides a single place to swap out the icon library
export const Icon: React.FC<IconProps> = ({ className, size, lineHeight, icon, disableOffset, ...props }) => (
  <FontAwesomeIcon
    {...props}
    className={cs(styledTextSizeClassNames(size, lineHeight), styles.icon, {
      [styles.offset]: !disableOffset,
    }, className)}
    icon={icon}
  />
)
