import _ from 'lodash'
import { createContext, KeyboardEvent } from 'react'

interface ContextValue {
  handleChange: (value: string) => any
  handleKeyDown: (event: KeyboardEvent) => any
  isSelected: (value: string) => boolean
  name: string
}

export default createContext<ContextValue>({
  handleChange: _.noop,
  handleKeyDown: _.noop,
  isSelected: () => false,
  name: '',
})
