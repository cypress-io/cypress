import React, { useState } from 'react'

import { SpecItem } from './SpecItem'
import { OnSelectSpec } from './SpecFileItem'
import { SearchSpec } from './components/SearchSpec'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import './spec-list.scss'

interface SpecsListProps {
  selectedSpecs: string[]
  specs: Cypress.Cypress['spec'][]
  onSelectSpec: OnSelectSpec
}

export const SpecList: React.FC<SpecsListProps> = (props) => {
  const [search, setSearch] = useState('')
  const filteredSpecs = props.specs.filter((spec) => spec.name.toLowerCase().includes(search))
  const hierarchy = makeSpecHierarchy(filteredSpecs)

  return (
    <>
      <SearchSpec
        value={search}
        onSearch={setSearch}
      />
      <ul className="specs-list">
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
    </>
  )
}
