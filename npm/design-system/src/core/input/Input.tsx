import React, { InputHTMLAttributes } from 'react'
import { useFocusRing } from 'react-aria'
import cs from 'classnames'

import { focusClass } from 'css/derived/util'
import { BasicInput, BasicInputProps, InputBase, InputProps, InputRenderer } from './InputBase'

import styles from './InputBase.module.scss'

export const Input: React.FC<InputProps<{}>> = (props) => (
  <InputBase
    {...props}
    InputRenderer={BasicInputRenderer}
  />
)

// TODO: The types here are not as elegant as I would like
const BasicInputRenderer: InputRenderer<Omit<BasicInputProps, 'inputRef'>> = ({ componentProps, inputProps, inputRef }) => {
  const { isFocused, focusProps } = useFocusRing({ isTextInput: true })

  return (
    <span
      className={cs(styles.wrapper, {
        [focusClass]: isFocused,
      }, componentProps.className)}
    >
      <BasicInput {...inputProps as Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>} {...focusProps} {...componentProps} inputRef={inputRef} className={inputProps.className} />
    </span>
  )
}
