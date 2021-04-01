import * as React from 'react'
import { InputHTMLAttributes, MouseEvent } from 'react'
import cs from 'classnames'
import { useFocusRing } from '@react-aria/focus'
import { Icon, IconProps } from '../icon/Icon'
import { BasicInput, InputBase, InputProps, InputRenderer } from './InputBase'

import { focusClass, modifySize } from '../../css/derived/util'
import { textSizeToClassName } from '../text/StyledText'
import { IconButton } from '../button/IconButton'

import styles from './IconInput.module.scss'

export type IconInputProps = InputProps<{
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
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>>

export const IconInput: React.FC<IconInputProps> = (props) => <InputBase {...props} inputRenderer={IconInputComponent} />

const IconInputComponent: InputRenderer<IconInputProps> = ({ size = 'm', prefixIcon, suffixIcon, ...props }, inputProps, inputRef) => {
  const iconSize = modifySize(size, 2)
  const { isFocused, focusProps } = useFocusRing({ isTextInput: true })

  const prefixIconProps = prefixIcon ? {
    className: cs(prefixIcon.onClick ? styles.iconButton : styles.icon, prefixIcon.className),
    size: iconSize,
    onClick: prefixIcon.onClick,
  } : {}

  const suffixIconProps = suffixIcon ? {
    className: cs(suffixIcon.onClick ? styles.iconButton : styles.icon, suffixIcon.className),
    size: iconSize,
    onClick: suffixIcon.onClick,
  } : {}

  return (
    <span className={cs(styles.iconInput, { [focusClass]: isFocused })}>
      {prefixIcon && (
        prefixIcon.onClick ? (
          <IconButton
            {...prefixIconProps}
            elementType='button'
            color='white'
            noBorder={true}
            ignoreTextCenter={false}
            icon={prefixIcon.icon}
          />
        ) : <Icon {...prefixIconProps} icon={prefixIcon.icon} />
      )}
      {/* Apply iconSize to input wrapper, so we have the same em measure */}
      <div className={cs(textSizeToClassName(iconSize), styles.wrapper)}>
        <BasicInput
          {...inputProps}
          {...focusProps}
          inputRef={inputRef}
          textArea={false}
          className={cs(styles.input, props.className)}
          size={size}
        />
      </div>
      {suffixIcon && (
        suffixIconProps.onClick ? (
          <IconButton
            {...suffixIconProps}
            elementType='button'
            color='white'
            noBorder={true}
            ignoreTextCenter={false}
            icon={suffixIcon.icon}
          />
        ) : <Icon {...suffixIconProps} icon={suffixIcon.icon} />
      )}
    </span>
  )
}
