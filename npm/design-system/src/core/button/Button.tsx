import * as React from 'react'
import { useRef, RefObject } from 'react'
import cs from 'classnames'

import { useButton } from '@react-aria/button'
import { AriaButtonProps } from '@react-types/button'
import { TextSizableComponent } from '../shared'
import { styledTextSizeClassNames } from '../text/StyledText'
import { Spacing } from '../../css'

import styles from './Button.module.scss'
import { paddingClass } from '../../css/derived/util'

export type ButtonProps = {
  /**
   * Defaults to 's'
   */
  padding?: Spacing

  /**
   * Defaults to 'blue'
   */
  color?: 'blue' | 'white'
} & TextSizableComponent & (({
  elementType: 'button'
} & AriaButtonProps<'button'>) | ({
  elementType: 'a'
} & AriaButtonProps<'a'>))

export const Button: React.FC<ButtonProps> = ({ padding, size, color, children, ...props }) => {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)

  const { buttonProps } = useButton(props, buttonRef)

  const textClass = styledTextSizeClassNames(size)

  const classNames = cs(textClass, paddingClass(padding ?? 's'), styles.button, {
    [styles.white]: color === 'white',
  }, buttonProps.className, props.className)

  return (
    props.elementType === 'button' ? (
      <button
        {...buttonProps}
        ref={buttonRef as RefObject<HTMLButtonElement>}
        className={classNames}
      >
        {children}
      </button>
    ) : (
      <a {...buttonProps} ref={buttonRef as RefObject<HTMLAnchorElement>} className={classNames}>
        {children}
      </a>
    )
  )
}
