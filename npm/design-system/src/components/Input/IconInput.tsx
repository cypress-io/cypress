import * as React from 'react'
import { MouseEvent } from 'react'
import { Icon, IconProps } from '../../core/icon/Icon'
import { Input, InputProps } from './Input'

export interface IconInputProps extends InputProps {
  prefixIcon?: {
    icon: IconProps['icon']
    hideOnFocus?: boolean
    onClick?: (event: MouseEvent<SVGSVGElement>) => void
    hidden?: boolean
  }
  suffixIcon?: {
    icon: IconProps['icon']
    hideOnFocus?: boolean
    onClick?: (event: MouseEvent<SVGSVGElement>) => void
    hidden?: boolean
  }
}

export const IconInput: React.FC<IconInputProps> = ({ prefixIcon, suffixIcon, ...props }) => {
  return (
    <span>
      {prefixIcon && <Icon icon={prefixIcon.icon} onClick={prefixIcon.onClick} />}
      <Input {...props} />
      {suffixIcon && <Icon icon={suffixIcon.icon} onClick={suffixIcon.onClick} />}
    </span>
  )
}
