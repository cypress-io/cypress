import * as React from 'react'
import hotkeys from 'hotkeys-js'
import './index.scss'

interface SearchSpecProps {
  value: string
  onSearch: (query: string) => void
}

export const SearchSpec: React.FC<SearchSpecProps> = (props) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  // const ignoreSlashInput

  React.useEffect(() => {
    hotkeys('/', () => {
      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    })

    return () => hotkeys.unbind('/')
  }, [])

  return (
    <div className="specs-list-search-input-container">
      <input
        ref={inputRef}
        placeholder='Find spec...'
        value={props.value}
        onChange={(e) => props.onSearch(e.currentTarget.value.toLowerCase())}
      />
    </div>
  )
}
