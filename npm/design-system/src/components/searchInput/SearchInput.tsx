import * as React from 'react'
import { FormEvent, useCallback } from 'react'
import { IconInput, IconSettings } from '../../core/input/IconInput'
import { CoreComponent } from '../../core/shared'
import { TextSize } from '../../css'

export interface SearchInputProps extends CoreComponent {
  value: string
  placeholder: string

  /**
   * Defaults to 'm'
   */
   size?: TextSize

   onInput: (input: string) => void
}

const prefixItem: IconSettings = {
  icon: 'search',
}

export const SearchInput: React.FC<SearchInputProps> = ({ onInput: externalOnInput, ...props }) => {
  const onInput = useCallback((e: FormEvent<HTMLInputElement>) => externalOnInput(e.currentTarget.value), [externalOnInput])
  const onClear = useCallback(() => externalOnInput(''), [externalOnInput])

  // TODO: Focus input when clearing search
  return <IconInput {...props} prefixIcon={prefixItem} suffixIcon={{ icon: 'times', onPress: onClear, 'aria-label': 'Clear search' }} onInput={onInput} />
}
