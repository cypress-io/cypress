import React from 'react'
import { SpecGroupItem } from './SpecGroupItem'
import { OnSelectSpec, SpecFileItem } from './SpecFileItem'
import { SpecFolderOrSpecFile } from '../../src/SpecList/make-spec-hierarchy'

interface SpecItemProps {
  item: SpecFolderOrSpecFile
  selectedSpecs: string[]
  onSelectSpec: OnSelectSpec
}

export const SpecItem: React.FC<SpecItemProps> = (props) => {
  if (props.item.type === 'file') {
    return (
      <SpecFileItem
        spec={props.item}
        selected={props.selectedSpecs.includes(props.item.absolute)}
        onSelectSpec={props.onSelectSpec}
      />
    )
  }

  return (
    <SpecGroupItem
      group={props.item}
      selectedSpecs={props.selectedSpecs}
      onSelectSpec={props.onSelectSpec}
    />
  )
}
