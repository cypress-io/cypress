import React from 'react'

import { SpecFolderOrSpecFile } from '../../src/SpecList/make-spec-hierarchy'
import { SpecItem } from './SpecItem'
import { OnSelectSpec } from './SpecFileItem'
import './spec-list.scss'

interface SpecsListProps {
  hierarchy: SpecFolderOrSpecFile[]
  selectedSpecs: string[]
  onSelectSpec: OnSelectSpec
}

export const SpecList: React.FC<SpecsListProps> = (props) => {
  return (
    <div className="specs-list">
      <div className="specs-list-scroll-container">
        <ul className="specs-list-container">
          {
            props.hierarchy.map((item) => (
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
    </div>
  )
}
