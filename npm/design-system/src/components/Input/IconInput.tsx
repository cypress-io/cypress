import * as React from 'react'
import { CSSProperties, MouseEvent, useMemo } from 'react'
import cs from 'classnames'
import { Icon, IconProps } from '../../core/icon/Icon'
import { Input, InputProps } from './Input'
import { TextSize } from '../../css'

import styles from './IconInput.module.scss'
import { modifySize, typographySizeFromSize } from '../../css/derived/util'

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
  const iconSize = modifySize(size ?? 'm', 2)

  const hasPrefixIcon = !!prefixIcon
  const hasSuffixIcon = !!suffixIcon

  const inputStyling = useMemo((): CSSProperties | undefined => {
    if (!hasPrefixIcon && !hasSuffixIcon) {
      return undefined
    }

    const style: CSSProperties = {}

    const rawSize = typographySizeFromSize(iconSize)
    const padding = `${rawSize}rem`

    if (hasPrefixIcon) {
      style.paddingLeft = `${rawSize + parseFloat(styles.iconMargin)}rem`
      style.marginLeft = `-${padding}`
    }

    if (hasSuffixIcon) {
      style.paddingRight = padding
      style.marginRight = `-${padding}`
    }

    return style
  }, [hasPrefixIcon, hasSuffixIcon, iconSize])

  return (
    <span className={styles.iconInput}>
      {prefixIcon && <Icon className={cs({ [styles.click]: !!prefixIcon.onClick }, styles.icon, prefixIcon.className)} size={iconSize} disableOffset={true} icon={prefixIcon.icon} onClick={prefixIcon.onClick} />}
      <Input {...props} className={cs(styles.input, props.className)} style={inputStyling} size={size} />
      {suffixIcon && <Icon className={cs({ [styles.click]: !!suffixIcon.onClick }, styles.icon, suffixIcon.className)} size={iconSize} disableOffset={true} icon={suffixIcon.icon} onClick={suffixIcon.onClick} />}
    </span>
  )
}
