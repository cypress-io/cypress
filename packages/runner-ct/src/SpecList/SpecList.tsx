import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { SpecItem } from './SpecItem'
import { OnSelectSpec } from './SpecFileItem'
import { SearchSpec } from './components/SearchSpec'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import styles from './SpecList.module.scss'
import cs from 'classnames'

interface SpecsListProps {
  selectedSpecs: string[]
  specs: Cypress.Cypress['spec'][]
  onSelectSpec: OnSelectSpec
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
}

export const SpecList: React.FC<SpecsListProps> = observer((props) => {
  const [search, setSearch] = useState('')
  const filteredSpecs = props.specs.filter((spec) => spec.name.toLowerCase().includes(search))
  const hierarchy = makeSpecHierarchy(filteredSpecs)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selectSpecByIndex = (index: number) => {
      const spec = typeof index !== 'number' || index < 0
        ? filteredSpecs[0]
        : filteredSpecs[index]

      const specElement = document.querySelector(`[data-spec="${spec.relative}"]`) as HTMLDivElement

      if (specElement) {
        specElement.focus()
      }
    }

    const selectedSpecIndex = filteredSpecs.findIndex((spec) =>
      spec.relative === (document.activeElement as HTMLElement)?.dataset?.spec)

    if (e.key === 'ArrowUp') {
      return selectSpecByIndex(selectedSpecIndex - 1)
    }

    if (e.key === 'ArrowDown') {
      return selectSpecByIndex(selectedSpecIndex + 1)
    }
  }

  return (
    <div
      className={cs([styles.specListContainer, props.className])}
      onKeyDown={handleKeyDown}
      data-cy="specs-list"
    >
      <SearchSpec
        ref={props.inputRef}
        value={search}
        onSearch={setSearch}
      />
      <ul
        className={styles.specsList}
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
