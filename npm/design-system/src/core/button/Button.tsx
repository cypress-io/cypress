import * as React from 'react'
import { useRef, RefObject } from 'react'
import cs from 'classnames'

import { useButton } from '@react-aria/button'
import { AriaButtonProps } from '@react-types/button'
import { TextSizableComponent } from '../shared'
import { styledTextSizeClassNames } from '../text/StyledText'

import styles from './Button.module.scss'

interface SharedButtonProps extends TextSizableComponent {
  /**
   * Defaults to 'blue'
   */
  color?: 'blue' | 'white'
}

export type BaseButtonProps = SharedButtonProps & (({
  elementType: 'button'
} & AriaButtonProps<'button'>) | ({
  elementType: 'a'
} & AriaButtonProps<'a'>))

export type ButtonProps = SharedButtonProps & Omit<AriaButtonProps<'button'>, 'elementType'>

export type LinkButtonProps = ButtonProps & Omit<AriaButtonProps<'a'>, 'elementType'>

export const BaseButton: React.FC<BaseButtonProps> = ({ size, color, children, ...props }) => {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)

  const { buttonProps } = useButton(props, buttonRef)

  const textClass = styledTextSizeClassNames(size)

  const classNames = cs(textClass, styles.button, {
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

export const Button: React.FC<ButtonProps & Omit<AriaButtonProps<'button'>, 'elementType'>> = (props) => <BaseButton {...props} elementType='button' />

export const LinkButton: React.FC<ButtonProps & Omit<AriaButtonProps<'a'>, 'elementType'>> = (props) => <BaseButton {...props} elementType='a' />
