import * as React from 'react'
import { CSSProperties, InputHTMLAttributes, MutableRefObject, ReactNode, RefObject, TextareaHTMLAttributes, useMemo, useRef } from 'react'
import { useTextField } from 'react-aria'
import cs from 'classnames'

import { ExtractFirstArg } from 'util/types'
import { LineHeight, TextSize } from 'css'
import { styledTextSizeClassNames } from 'core/text/styledText'
import { SizingProps } from 'core/shared'

import styles from './InputBase.module.scss'
import { useCombinedRefs } from 'hooks/useCombinedRefs'

export interface SharedInputBaseProps extends SizingProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputRef?: MutableRefObject<HTMLTextAreaElement | HTMLInputElement | null> | null

  label: {
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
   * If true, render as a textarea (multiline) instead of an input. Defaults to false
   */
  textArea?: boolean
}

export type InputProps<T> = SharedInputBaseProps & {
  className?: string
  style?: CSSProperties
} & T

export interface InputRendererProps<T> {
  componentProps: Omit<InputProps<T>, 'label'>
  inputProps: InputHTMLAttributes<HTMLInputElement>
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>
}

export type InputRenderer<T> = React.FC<InputRendererProps<T>>

export type InputBaseProps<T> = SharedInputBaseProps & {
  InputRenderer: InputRenderer<T>
} & T

export const InputBase = <T, >({ InputRenderer, label, textArea, inputRef: externalInputRef = null, ...props }: InputBaseProps<T>) => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useCombinedRefs(inputRef, externalInputRef)

  const textFieldProps = useMemo((): ExtractFirstArg<typeof useTextField> => {
    const newProps = {
      ...props,
      inputElementType: textArea ? 'textarea' : 'input',
    } as ExtractFirstArg<typeof useTextField>

    if (label.type === 'aria') {
      newProps['aria-label'] = label.contents
    } else if (label.type === 'tag') {
      newProps.label = label.contents
    }

    return newProps
  }, [label, textArea, props])

  const { inputProps, labelProps } = useTextField(textFieldProps, inputRef)

  return (
    <>
      {label.type === 'tag' && (
        <label {...labelProps} className={cs(styledTextSizeClassNames(label.size, label.lineHeight), labelProps.className)}>
          {label.contents}
        </label>
      )}
      {/* TODO: This cast is incorrect. It can be textarea */}
      <InputRenderer componentProps={props as Omit<InputProps<T>, 'label'>} inputProps={inputProps as InputHTMLAttributes<HTMLInputElement>} inputRef={inputRef} />
    </>
  )
}

export type BasicInputProps = SizingProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>

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
