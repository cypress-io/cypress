import * as React from 'react'
import { CSSProperties, InputHTMLAttributes, ReactNode, RefObject, TextareaHTMLAttributes, useMemo, useRef } from 'react'
import { useTextField } from 'react-aria'
import { AriaTextFieldProps } from '@react-types/textfield'
import cs from 'classnames'

import { ExtractFirstArg } from '../../util/types'
import { LineHeight, TextSize } from '../../css'
import { styledTextSizeClassNames } from '../../core/text/StyledText'

export interface InputProps extends AriaTextFieldProps {
  className?: string
  style?: CSSProperties

  label?: {
    type: 'tag'
    contents: ReactNode
    labelClassName?: string
  } | {
    type: 'aria'
    contents: string
  }

  /**
   * If true, render as a textarea (multiline) instead of an input. Defaults to false
   */
  textArea?: boolean

  /**
   * Defaults to 'm'
   */
  size?: TextSize

  /**
  * Defaults to 'normal'
  */
  lineHeight?: LineHeight
}

export const Input: React.FC<InputProps> = ({ className, style, label, textArea, size, lineHeight, ...props }) => {
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

  const textClass = styledTextSizeClassNames(size, lineHeight)

  return (
    <>
      {label?.type === 'tag' && (
        <label {...labelProps} className={cs(textClass, labelProps.className)}>
          {label.contents}
        </label>
      )}
      {textArea
        ? <textarea {...inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>} ref={inputRef as RefObject<HTMLTextAreaElement>} className={cs(textClass, className)} style={style} />
        : <input {...inputProps as InputHTMLAttributes<HTMLInputElement>} ref={inputRef as RefObject<HTMLInputElement>} className={cs(textClass, className)} style={style} />}
    </>
  )
}
