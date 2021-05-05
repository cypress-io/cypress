import React, { KeyboardEvent, useMemo, FormEvent, MutableRefObject, useCallback } from 'react'
import { IconInput, IconSettings } from 'core/input/IconInput'
import { CoreComponent } from 'core/shared'
import { TextSize } from 'css'
import { useCombinedRefs } from '../../hooks/useCombinedRefs'

export interface SearchInputProps extends CoreComponent {
  inputRef?: MutableRefObject<HTMLInputElement> | null

  value?: string
  placeholder: string

  /**
   * Defaults to 'm'
   */
   size?: TextSize

   onInput: (input: string) => void
   onEnter?: (input: string) => void
   onVerticalArrowKey?: (key: 'up' | 'down') => void

  ['aria-label']: string
}

const prefixItem: IconSettings = {
  icon: 'search',
}

export const SearchInput: React.FC<SearchInputProps> = ({ inputRef = null, onInput: externalOnInput, onEnter, onVerticalArrowKey, ...props }) => {
  const ref = React.useRef<HTMLInputElement>(null)

  useCombinedRefs(ref, inputRef)

  const onInput = useCallback((e: FormEvent<HTMLInputElement>) => externalOnInput(e.currentTarget.value), [externalOnInput])
  const onClear = useCallback(() => {
    if (ref.current) {
      ref.current.value = ''
    }

    externalOnInput('')

    ref.current?.focus()
  }, [externalOnInput])

  const onKeyDown = useMemo(() => onEnter || onVerticalArrowKey ? (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.(e.currentTarget.value)
        break
      case 'ArrowUp':
        onVerticalArrowKey?.('up')
        break
      case 'ArrowDown':
        onVerticalArrowKey?.('down')
        break
      default:
        return
    }

    // If we get here, we matched a key
    e.preventDefault()
  } : undefined, [onEnter, onVerticalArrowKey])

  const value = props.value ?? ref.current?.value

  return (
    <IconInput
      {...props}
      inputRef={ref}
      label={{ type: 'aria', contents: props['aria-label'] }}
      prefixIcon={prefixItem}
      suffixIcon={value ? { icon: 'times', onPress: onClear, 'aria-label': 'Clear search' } : undefined}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      onInput={onInput}
      onKeyDown={onKeyDown}
    />
  )
}
