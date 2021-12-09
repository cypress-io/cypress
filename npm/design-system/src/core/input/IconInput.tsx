import * as React from 'react'
import { RefAttributes } from 'react'
import cs from 'classnames'
import { useFocusRing } from '@react-aria/focus'
import { PressEvent } from '@react-types/shared'
import { Icon, IconProps } from '../icon/Icon'
import { BasicInput, InputBase, InputProps, InputRenderer } from './InputBase'

import { focusClass, modifySize } from 'css/derived/util'
import { textSizeToClassName } from 'core/text/styledText'
import { IconButton, IconButtonProps } from '../button/IconButton'

import styles from './IconInput.module.scss'

export type IconSettings = {
  className?: string
  icon: IconProps['icon']
  hideOnFocus?: boolean
  hidden?: boolean
} & ({
  // If click is specified, it _must_ have an aria label
  onPress: (event: PressEvent) => void
  ['aria-label']: string
} | {
  onPress?: undefined
  ['aria-label']?: string | undefined
})

export type IconInputProps = InputProps<{
  prefixIcon?: IconSettings
  suffixIcon?: IconSettings
}>
& RefAttributes<HTMLInputElement>

export const IconInput: React.FC<IconInputProps> = (props) => <InputBase {...props} InputRenderer={IconInputComponent} />

const IconInputComponent: InputRenderer<IconInputProps> = ({ componentProps: { size = 'm', prefixIcon, suffixIcon, className, ...props }, inputProps, inputRef }) => {
  const iconSize = modifySize(size, 2)
  const { isFocused, focusProps } = useFocusRing({ isTextInput: true })

  const prefixIconProps = prefixIcon ? {
    className: cs(prefixIcon.onPress ? styles.iconButton : styles.icon, prefixIcon.className),
    size: iconSize,
    ['aria-label']: prefixIcon['aria-label'],
  } : {}

  const suffixIconProps = suffixIcon ? {
    className: cs(suffixIcon.onPress ? styles.iconButton : styles.icon, suffixIcon.className),
    size: iconSize,
    ['aria-label']: suffixIcon['aria-label'],
  } : {}

  return (
    <span className={cs(styles.iconInput, { [focusClass]: isFocused }, className)}>
      {prefixIcon && (
        prefixIcon.onPress ? (
          <IconButton
            {...prefixIconProps as IconButtonProps}
            elementType='button'
            color='white'
            noBorder={true}
            ignoreTextCenter={false}
            icon={prefixIcon.icon}
            onPress={prefixIcon.onPress}
          />
        ) : <Icon {...prefixIconProps} icon={prefixIcon.icon} />
      )}
      {/* Apply iconSize to input wrapper, so we have the same em measure */}
      <div className={cs(textSizeToClassName(iconSize), styles.wrapper)}>
        <BasicInput
          {...props}
          {...inputProps}
          {...focusProps}
          inputRef={inputRef}
          textArea={false}
          className={cs(styles.input)}
          size={size}
        />
      </div>
      {suffixIcon && (
        suffixIcon.onPress ? (
          <IconButton
            {...suffixIconProps as IconButtonProps}
            elementType='button'
            color='white'
            noBorder={true}
            ignoreTextCenter={false}
            icon={suffixIcon.icon}
            onPress={suffixIcon.onPress}
          />
        ) : <Icon {...suffixIconProps} icon={suffixIcon.icon} />
      )}
    </span>
  )
}
