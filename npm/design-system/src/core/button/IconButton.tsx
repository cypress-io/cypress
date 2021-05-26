import * as React from 'react'
import { Icon, IconProps } from '../icon/Icon'
import { BaseButton, BaseButtonProps } from './Button'

export type IconButtonProps = {
  iconClassName?: string
} & BaseButtonProps & IconProps;

// We don't actually need to spread several of these props, but FontAwesome complains if it receives extra props
export const IconButton: React.FC<IconButtonProps> = ({ className, iconClassName, color, elementType, noBorder, onPress, ...props }) => (
  // Cast to button just to prevent TS error
  <BaseButton
    {...props}
    elementType={elementType as 'button'}
    className={className}
    color={color}
    noBorder={noBorder}
    onPress={onPress}
  >
    <Icon ignoreTextCenter={true} {...props} aria-label={undefined} className={iconClassName} />
  </BaseButton>
)
