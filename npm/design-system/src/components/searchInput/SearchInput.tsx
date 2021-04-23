import React, { KeyboardEvent, useMemo, FormEvent, MutableRefObject, useCallback } from 'react'
import { IconInput, IconSettings } from 'core/input/IconInput'
import { CoreComponent } from 'core/shared'
import { TextSize } from 'css'
import { useCombinedRefs } from '../../hooks/useCombinedRefs'

export interface SearchInputProps extends CoreComponent {
  inputRef?: MutableRefObject<HTMLInputElement> | null

  value: string
  placeholder: string

  /**
   * Defaults to 'm'
   */
   size?: TextSize

   onInput: (input: string) => void
   onEnter?: (input: string) => void

  ['aria-label']: string
}

const prefixItem: IconSettings = {
  icon: 'search',
}

export const SearchInput: React.FC<SearchInputProps> = ({ inputRef = null, onInput: externalOnInput, onEnter, ...props }) => {
  const ref = React.useRef<HTMLInputElement>(null)

  useCombinedRefs(ref, inputRef)

  const onInput = useCallback((e: FormEvent<HTMLInputElement>) => externalOnInput(e.currentTarget.value), [externalOnInput])
  const onClear = useCallback(() => {
    externalOnInput('')

    ref.current?.focus()
  }, [externalOnInput])

  const onKeyDown = useMemo(() => onEnter ? (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEnter(e.currentTarget.value)
    }
  } : undefined, [onEnter])

  return (
    <IconInput
      {...props}
      inputRef={ref}
      label={{ type: 'aria', contents: props['aria-label'] }}
      prefixIcon={prefixItem}
      suffixIcon={props.value.length > 0 ? { icon: 'times', onPress: onClear, 'aria-label': 'Clear search' } : undefined}
      onInput={onInput}
      onKeyDown={onKeyDown}
    />
  )
}
