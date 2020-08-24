import * as React from 'react'

// simple example of typescript types
type SomeTsxType = {
  tsxProp: string
}

export const tsxTypeExample: SomeTsxType = { tsxProp: 'tsx value' }

export const fromTsx = <div />
