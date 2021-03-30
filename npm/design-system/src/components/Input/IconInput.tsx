import * as React from 'react'
import { MouseEvent } from 'react'
import cs from 'classnames'
import { Icon, IconProps } from '../../core/icon/Icon'
import { Input, InputProps } from './Input'
import { TextSize } from '../../css'

import styles from './IconInput.module.scss'

export interface IconInputProps extends InputProps {
  /**
   * Defaults to 'm'
   */
  size?: TextSize

  prefixIcon?: {
    className?: string
    icon: IconProps['icon']
    hideOnFocus?: boolean
    onClick?: (event: MouseEvent<SVGSVGElement>) => void
    hidden?: boolean
  }
  suffixIcon?: {
    className?: string
    icon: IconProps['icon']
    hideOnFocus?: boolean
    onClick?: (event: MouseEvent<SVGSVGElement>) => void
    hidden?: boolean
  }
}

export const IconInput: React.FC<IconInputProps> = ({ size, prefixIcon, suffixIcon, ...props }) => {
  return (
    <span>
      {prefixIcon && <Icon className={cs(styles.click, prefixIcon.className)} size="ml" icon={prefixIcon.icon} onClick={prefixIcon.onClick} />}
      <Input {...props} size='ms' />
      {suffixIcon && <Icon className={cs(styles.click, suffixIcon.className)} size="ml" icon={suffixIcon.icon} onClick={suffixIcon.onClick} />}
    </span>
  )
}
