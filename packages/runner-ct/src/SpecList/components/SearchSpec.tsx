import * as React from 'react'
import './SearchSpec.scss'

interface SearchSpecProps extends React.RefAttributes<HTMLInputElement> {
  value: string
  onSearch: (query: string) => void
}

export const SearchSpec: React.FC<SearchSpecProps> = React.forwardRef((props, ref) => {
  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // types are wrong?
      (ref as React.MutableRefObject<HTMLInputElement>).current?.blur()
    }
  }

  return (
    <div className='specs-list-search-input-container'>
      <input
        ref={ref}
        placeholder='Find spec...'
        value={props.value}
        type='search'
        onKeyDown={onKeyUp}
        onChange={(e) => props.onSearch(e.currentTarget.value.toLowerCase())}
      />
    </div>
  )
})
