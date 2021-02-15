import * as React from 'react'
import './SearchSpec.scss'

interface SearchSpecProps extends React.RefAttributes<HTMLInputElement> {
  value: string
  onSearch: (query: string) => void
}

export const SearchSpec: React.FC<SearchSpecProps> = React.forwardRef((props, ref) => {
  return (
    <div className="specs-list-search-input-container">
      <input
        ref={ref}
        placeholder='Find spec...'
        value={props.value}
        onChange={(e) => props.onSearch(e.currentTarget.value.toLowerCase())}
      />
    </div>
  )
})
