import * as React from 'react'
import { Icon, IconProps } from '../icon/Icon'
import { BaseButton, BaseButtonProps } from './Button'

export type IconButtonProps = BaseButtonProps & IconProps;

export const IconButton: React.FC<IconButtonProps> = ({ color, ...props }) => {
  return (
    <BaseButton color={color} {...props}>
      <Icon {...props} ignoreTextCenter={true} />
    </BaseButton>
  )
}
