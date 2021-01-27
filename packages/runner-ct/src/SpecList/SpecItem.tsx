import React from 'react'
import { SpecGroupItem } from './SpecGroupItem'
import { SpecFileItem } from './SpecFileItem'
import { SpecFolderOrSpecFile } from '../specs/make-spec-hierarchy'

interface SpecItemProps {
  item: SpecFolderOrSpecFile
  selectedSpecs: string[]
}

export function SpecItem(props: SpecItemProps) {
  if (props.item.type === 'file') {
    console.log(props.selectedSpecs, props.item.absolute)
    return (
      <SpecFileItem
        spec={props.item}
        selected={props.selectedSpecs.includes(props.item.absolute)}
      />
    )
  }

  if (props.item.type === 'folder') {
    return (
      <SpecGroupItem
        group={props.item}
        selectedSpecs={props.selectedSpecs}
      />
    )
  }

  throw Error(`Expected props.item.type to be file or folder, got ${props.item.type}`)
}
