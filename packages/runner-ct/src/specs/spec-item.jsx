import React from 'react'
import { SpecFile } from './spec-file'
import { SpecGroup } from './spec-group'

export function SpecItem ({ item, state }) {
  return item.type === 'file'
    ? <SpecFile
      path={item.name}
      state={state}
      spec={item}/>
    : <SpecGroup
      group={item}
      state={state}
    />
}
