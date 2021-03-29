import * as React from 'react'
import { InputHTMLAttributes, ReactNode, RefObject, TextareaHTMLAttributes, useMemo, useRef } from 'react'
import { useTextField } from 'react-aria'
import { AriaTextFieldProps } from '@react-types/textfield'

import { ExtractFirstArg } from '../../util/types'

export interface InputProps extends AriaTextFieldProps {
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
}

export const Input: React.FC<InputProps> = ({ label, textArea, ...props }) => {
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
        <label {...labelProps}>
          {label.contents}
        </label>
      )}
      {textArea
        ? <textarea {...inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>} ref={inputRef as RefObject<HTMLTextAreaElement>} />
        : <input {...inputProps as InputHTMLAttributes<HTMLInputElement>} ref={inputRef as RefObject<HTMLInputElement>} />}
    </>
  )
}
