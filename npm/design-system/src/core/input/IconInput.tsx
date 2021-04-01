import * as React from 'react'
import { MouseEvent } from 'react'
import cs from 'classnames'
import { useFocusRing } from '@react-aria/focus'
import { IconProps } from '../icon/Icon'
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
}>

export const IconInput: React.FC<IconInputProps> = (props) => <InputBase {...props} inputRenderer={IconInputComponent} />

const IconInputComponent: InputRenderer<IconInputProps> = ({ size = 'm', prefixIcon, suffixIcon, ...props }, inputProps, inputRef) => {
  const iconSize = modifySize(size, 2)
  const { isFocused, focusProps } = useFocusRing({ isTextInput: true })

  return (
    <span className={cs(styles.iconInput, { [focusClass]: isFocused })}>
      {prefixIcon && (
        <IconButton
          className={cs({ [styles.click]: !!prefixIcon.onClick }, styles.iconButton, prefixIcon.className)}
          elementType='button'
          size={iconSize}
          color='white'
          noBorder={true}
          ignoreTextCenter={false}
          icon={prefixIcon.icon}
          onClick={prefixIcon.onClick}
        />
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
        <IconButton
          className={cs({ [styles.click]: !!suffixIcon.onClick }, styles.iconButton, suffixIcon.className)}
          elementType='button'
          size={iconSize}
          color='white'
          noBorder={true}
          ignoreTextCenter={false}
          icon={suffixIcon.icon}
          onClick={suffixIcon.onClick}
        />
      )}
    </span>
  )
}
