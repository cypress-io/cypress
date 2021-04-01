import * as React from 'react'
import { Icon, IconProps } from '../icon/Icon'
import { BaseButton, BaseButtonProps } from './Button'

export type IconButtonProps = {
  iconClassName?: string
} & BaseButtonProps & IconProps;

export const IconButton: React.FC<IconButtonProps> = ({ className, iconClassName, color, ...props }) => {
  return (
    <BaseButton {...props} className={className} color={color}>
      <Icon ignoreTextCenter={true} {...props} className={iconClassName} />
    </BaseButton>
  )
}
