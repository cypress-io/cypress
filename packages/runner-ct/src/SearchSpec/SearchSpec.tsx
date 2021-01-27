import React from 'react'
import './index.scss'

interface SearchSpecProps {
  value: string
  onSearch: (query: string) => void
}

export const SearchSpec: React.FC<SearchSpecProps> = props => {
  return (
    <div className="specs-list-search-input-container">
      <input
        placeholder='Find spec...'
        value={props.value}
        onChange={e => props.onSearch(e.currentTarget.value.toLowerCase())}
      />
    </div>
  )
}