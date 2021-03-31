import * as React from 'react'
import { CSSProperties, InputHTMLAttributes, ReactNode, RefObject, TextareaHTMLAttributes, useMemo, useRef } from 'react'
import { useTextField } from 'react-aria'
import cs from 'classnames'

import { ExtractFirstArg } from '../../util/types'
import { LineHeight, TextSize } from '../../css'
import { styledTextSizeClassNames } from '../../core/text/StyledText'

import styles from './InputBase.module.scss'

export interface SharedInputBaseProps {
  label?: {
    type: 'tag'
    contents: ReactNode
    labelClassName?: string
    size?: TextSize
    lineHeight?: LineHeight
  } | {
    type: 'aria'
    contents: string
  }

  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight

  /**
   * If true, render as a textarea (multiline) instead of an input. Defaults to false
   */
  textArea?: boolean
}

export type InputProps<T> = SharedInputBaseProps & {
  className?: string
  style?: CSSProperties
} & T

export type InputRenderer<T> = (componentProps: InputProps<T>, inputProps: InputHTMLAttributes<HTMLInputElement>, inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>) => ReactNode

export type InputBaseProps<T> = SharedInputBaseProps & {
  inputRenderer: InputRenderer<T>
} & T

export const InputBase = <T, >({ inputRenderer, label, textArea, ...props }: InputBaseProps<T>) => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  const textFieldProps = useMemo((): ExtractFirstArg<typeof useTextField> => {
    const newProps: ExtractFirstArg<typeof useTextField> = {
      ...props,
      inputElementType: textArea ? 'textarea' : 'input',
    }

    if (label?.type === 'aria') {
      newProps['aria-label'] = label.contents
    } else if (label?.type === 'tag') {
      newProps.label = label.contents
    }

    return newProps
  }, [label, textArea, props])

  const { inputProps, labelProps } = useTextField(textFieldProps, inputRef)

  return (
    <>
      {label?.type === 'tag' && (
        <label {...labelProps} className={cs(styledTextSizeClassNames(label.size, label.lineHeight), labelProps.className)}>
          {label.contents}
        </label>
      )}
      {/* TODO: This cast is incorrect. It can be textarea */}
      {inputRenderer(props as InputProps<T>, inputProps as InputHTMLAttributes<HTMLInputElement>, inputRef)}
    </>
  )
}

export type BasicInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>

  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
   * Defaults to 'normal'
   */
  lineHeight?: LineHeight

  /**
   * If true, render as a textarea (multiline) instead of an input. Defaults to false
   */
   textArea?: boolean
}

/**
 * **Note:** Should not be directly rendered in app code. This should only be provided in an `inputRenderer` function
 */
export const BasicInput: React.FC<BasicInputProps> = ({ inputRef, className, size, lineHeight, textArea, ...props }) => {
  const textClass = styledTextSizeClassNames(size, lineHeight)

  return textArea
    ? <textarea {...props as TextareaHTMLAttributes<HTMLTextAreaElement>} ref={inputRef as RefObject<HTMLTextAreaElement>} className={cs(textClass, styles.input, className)} />
    : <input {...props as InputHTMLAttributes<HTMLInputElement>} ref={inputRef as RefObject<HTMLInputElement>} className={cs(textClass, styles.input, className)} />
}

// TODO: The types here are not as elegant as I would like
export const basicInputRenderer: InputRenderer<Omit<BasicInputProps, 'inputRef'>> = (props, inputProps, inputRef) =>
  <BasicInput {...inputProps as Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>} {...props} inputRef={inputRef} className={cs(inputProps.className, props.className)} />
