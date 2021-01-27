import React from 'react'

import { SpecFolderOrSpecFile } from '../specs/make-spec-hierarchy'
import { SpecItem } from './SpecItem'
import './spec-list.scss'

interface SpecsListProps {
  hierarchy: SpecFolderOrSpecFile[]
  selectedSpecs: string[]
}

export const SpecList: React.FC<SpecsListProps> = props => {
  return (
    <div className="specs-list">
      <div className="specs-list-scroll-container">
        <ul className="specs-list-container">
          {
            props.hierarchy.map((item) =>
              <SpecItem
                key={item.shortName}
                selectedSpecs={props.selectedSpecs}
                item={item}
              />
            )
          }
        </ul>
      </div>
    </div>
  )
}