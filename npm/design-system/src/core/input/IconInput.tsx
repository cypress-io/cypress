import * as React from 'react'
import { CSSProperties, MouseEvent, useMemo } from 'react'
import cs from 'classnames'
import { Icon, IconProps } from '../icon/Icon'
import { BasicInput, InputBase, InputProps, InputRenderer } from './InputBase'
import { TextSize } from '../../css'

import styles from './IconInput.module.scss'
import { modifySize, typographySizeFromSize } from '../../css/derived/util'
import { textSizeToClassName } from '../text/StyledText'

export type IconInputProps = InputProps<{
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
}>

export const IconInput: React.FC<IconInputProps> = (props) => <InputBase {...props} inputRenderer={IconInputComponent} />

const IconInputComponent: InputRenderer<IconInputProps> = ({ size = 'm', prefixIcon, suffixIcon, ...props }, inputProps, inputRef) => {
  const iconSize = modifySize(size, 2)

  const hasPrefixIcon = !!prefixIcon
  const hasSuffixIcon = !!suffixIcon

  const [inputWrapper, inputStyle] = useMemo((): [CSSProperties | undefined, CSSProperties | undefined] => {
    if (!hasPrefixIcon && !hasSuffixIcon) {
      return [undefined, undefined]
    }

    // Size in rem
    const wrapperSize = typographySizeFromSize(iconSize)

    // Size in rem
    const actualInputSize = typographySizeFromSize(size)

    // Want it to be wrapper size, but relative to the wrapper's font-size, not the input's
    const padding = `${(parseFloat(styles.iconSize) * (wrapperSize / actualInputSize)) - parseFloat(styles.iconMargin)}em`

    const inputWrapperStyling: CSSProperties = {}
    const inputStyling: CSSProperties = {}

    if (hasPrefixIcon) {
      inputStyling.paddingLeft = padding
      inputWrapperStyling.marginLeft = `-${styles.iconSize}`
    }

    if (hasSuffixIcon) {
      inputStyling.paddingRight = padding
      inputWrapperStyling.marginRight = `-${styles.iconSize}`
    }

    return [inputWrapperStyling, inputStyling]
  }, [hasPrefixIcon, hasSuffixIcon, iconSize, size])

  return (
    <span className={styles.iconInput}>
      {prefixIcon && <Icon className={cs({ [styles.click]: !!prefixIcon.onClick }, styles.icon, prefixIcon.className)} size={iconSize} disableOffset={true} icon={prefixIcon.icon} onClick={prefixIcon.onClick} />}
      {/* Apply iconSize to input wrapper, so we have the same em measure */}
      <div className={cs(textSizeToClassName(iconSize), styles.wrapper)} style={inputWrapper}>
        <BasicInput
          {...inputProps}
          inputRef={inputRef}
          textArea={false}
          className={cs(styles.input, props.className)}
          style={inputStyle}
          size={size}
        />
      </div>
      {suffixIcon && <Icon className={cs({ [styles.click]: !!suffixIcon.onClick }, styles.icon, suffixIcon.className)} size={iconSize} disableOffset={true} icon={suffixIcon.icon} onClick={suffixIcon.onClick} />}
    </span>
  )
}
