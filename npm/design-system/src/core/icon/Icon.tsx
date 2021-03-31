import * as React from 'react'
import { SVGAttributes } from 'react'
import cs from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName } from '@fortawesome/fontawesome-svg-core'
import { styledTextSizeClassNames } from '../text/StyledText'

import styles from './Icon.module.scss'
import { TextSizableComponent } from '../shared'

export interface IconProps extends TextSizableComponent, Omit<SVGAttributes<SVGSVGElement>, 'mask'> {
  // TODO: Limit literals to only those available in the iconset
  icon: IconName

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
