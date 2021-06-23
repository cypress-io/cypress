import * as React from 'react'
import type { SVGAttributes } from 'react'
import cs from 'classnames'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconName } from '@fortawesome/fontawesome-svg-core'
import { styledTextSizeClassNames } from 'core/text/styledText'

import styles from './Icon.module.scss'
import type { TextSizableComponent } from '../shared'

export interface IconProps extends TextSizableComponent, Omit<SVGAttributes<SVGSVGElement>, 'mask'> {
  // TODO: Limit literals to only those available in the iconset
  icon: IconName

  /**
   * Render icon at 1em without centering
   */
  ignoreTextCenter?: boolean

  /**
   * Render icon at text size without centering
   */
  sizeWithoutCenter?: boolean
}

// Currently only a passthrough for FontAwesome. This provides a single place to swap out the icon library
export const Icon: React.FC<IconProps> = ({ className, size, lineHeight, icon, ignoreTextCenter, sizeWithoutCenter, ...props }) => (
  <FontAwesomeIcon
    {...props}
    className={cs(styledTextSizeClassNames(size, lineHeight), styles.icon, {
      [styles.ignoreTextCenter]: ignoreTextCenter,
      [styles.sizeWithoutCenter]: sizeWithoutCenter,
    }, className)}
    icon={icon}
  />
)
