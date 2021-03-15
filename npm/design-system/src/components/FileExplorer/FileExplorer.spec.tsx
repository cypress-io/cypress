import { mount } from '@cypress/react'
import React from 'react'
import { FileExplorer } from './FileExplorer'
import { FileLike } from './types'

const files: FileLike[] = [
  {
    name: 'foo/bar/foo.spec.js',
    onClick: (e, foo) => {
    },
    isOpen: false,
  },
  // @ts-ignore
  { name: 'bar/foo.spec.tsx' },
  // @ts-ignore
  { name: 'merp/foo.spec.ts' },
]

describe('FileExplorer', () => {
  it('renders', () => {
    mount(<>
      <FileExplorer files={files} />
    </>)
  })
})
