import * as React from 'react'
import { InputHTMLAttributes, MouseEvent, RefAttributes } from 'react'
import cs from 'classnames'
import { useFocusRing } from '@react-aria/focus'
import { Icon, IconProps } from '../icon/Icon'
import { BasicInput, InputBase, InputProps, InputRenderer } from './InputBase'

import { focusClass, modifySize } from '../../css/derived/util'
import { textSizeToClassName } from '../text/StyledText'
import { IconButton, IconButtonProps } from '../button/IconButton'

import styles from './IconInput.module.scss'

export type IconSettings = {
  className?: string
  icon: IconProps['icon']
  hideOnFocus?: boolean
  hidden?: boolean
} & ({
  // If click is specified, it _must_ have an aria label
  onPress: (event: MouseEvent<SVGSVGElement>) => void
  ['aria-label']: string
} | {
  onPress?: undefined
  ['aria-label']?: undefined
})

export type IconInputProps = InputProps<{
  prefixIcon?: IconSettings
  suffixIcon?: IconSettings
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>>
& RefAttributes<HTMLInputElement>

export const IconInput: React.FC<IconInputProps> = (props) => <InputBase {...props} inputRenderer={IconInputComponent} />

const IconInputComponent: InputRenderer<IconInputProps> = ({ size = 'm', prefixIcon, suffixIcon, ...props }, inputProps, inputRef) => {
  const iconSize = modifySize(size, 2)
  const { isFocused, focusProps } = useFocusRing({ isTextInput: true })

  const prefixIconProps = prefixIcon ? {
    className: cs(prefixIcon.onPress ? styles.iconButton : styles.icon, prefixIcon.className),
    size: iconSize,
    onClick: prefixIcon.onPress,
    ['aria-label']: prefixIcon['aria-label'],
  } : {}

  const suffixIconProps = suffixIcon ? {
    className: cs(suffixIcon.onPress ? styles.iconButton : styles.icon, suffixIcon.className),
    size: iconSize,
    onPress: suffixIcon.onPress,
    ['aria-label']: suffixIcon['aria-label'],
  } : {}

  return (
    <span className={cs(styles.iconInput, { [focusClass]: isFocused })}>
      {prefixIcon && (
        prefixIcon.onPress ? (
          <IconButton
            {...prefixIconProps as IconButtonProps}
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
        suffixIconProps.onPress ? (
          <IconButton
            {...suffixIconProps as IconButtonProps}
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
