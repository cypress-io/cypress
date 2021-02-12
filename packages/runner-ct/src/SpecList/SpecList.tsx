import React, { useState } from 'react'

import cs from 'classnames'
import { observer } from 'mobx-react'
import { SpecItem } from './SpecItem'
import { OnSelectSpec } from './SpecFileItem'
import { SearchSpec } from './components/SearchSpec'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import './spec-list.scss'

interface SpecsListProps {
  selectedSpecs: string[]
  specs: Cypress.Cypress['spec'][]
  onSelectSpec: OnSelectSpec
  disableTextSelection?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

export const SpecList: React.FC<SpecsListProps> = observer((props) => {
  const [search, setSearch] = useState('')
  const filteredSpecs = props.specs.filter((spec) => spec.name.toLowerCase().includes(search))
  const hierarchy = makeSpecHierarchy(filteredSpecs)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selectSpecByIndex = (index: number) => {
      const spec = typeof index !== 'number' || index < 0
        ? props.specs[0]
        : props.specs[index]

      const specElement = document.querySelector(`[data-spec="${spec.relative}"]`) as HTMLDivElement

      if (specElement) {
        specElement.focus()
      }
    }

    const selectedSpecIndex = props.specs.findIndex((spec) =>
      spec.relative === (document.activeElement as HTMLElement)?.dataset?.spec)

    if (e.key === 'ArrowUp') {
      return selectSpecByIndex(selectedSpecIndex - 1)
    }

    if (e.key === 'ArrowDown') {
      return selectSpecByIndex(selectedSpecIndex + 1)
    }
  }

  return (
    <div className="specs-list-focus-container" onKeyDown={handleKeyDown}>
      <SearchSpec
        ref={props.inputRef}
        value={search}
        onSearch={setSearch}
      />
      <ul
        data-cy="specs-list"
        className={cs('specs-list', { 'specs-list_text-selection-disabled': props.disableTextSelection })}
      >
        {
          hierarchy.map((item) => (
            <SpecItem
              key={item.shortName}
              selectedSpecs={props.selectedSpecs}
              item={item}
              onSelectSpec={props.onSelectSpec}
            />
          ))
        }
      </ul>

    </div>
  )
})
