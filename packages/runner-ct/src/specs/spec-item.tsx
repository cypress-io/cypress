import React from 'react'
import State from '../lib/state'
import { SpecFolderOrSpecFile } from './make-spec-hierarchy'
import { SpecFile } from './spec-file'
import { SpecGroup } from './spec-group'

interface SpecItemProps {
  state: State,
  item: SpecFolderOrSpecFile
}

export function SpecItem ({ item, state }: SpecItemProps) {
  return item.type === 'file'
    ? (
      <SpecFile
        state={state}
        spec={item}
      />
    ) : (
      <SpecGroup
        group={item}
        state={state}
      />
    )
}
