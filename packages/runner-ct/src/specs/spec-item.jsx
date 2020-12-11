import React from 'react'
import { SpecFile } from './spec-file'
import { SpecGroup } from './spec-group'

export function SpecItem ({ item, state, parentPath }) {
  const newParentPath = `${parentPath}/${item.shortName}`

  return item.type === 'file'
    ? <SpecFile
      path={item.name}
      state={state}
      spec={item}/>
    : <SpecGroup
      group={item}
      state={state}
      parentPath={newParentPath}/>
}
