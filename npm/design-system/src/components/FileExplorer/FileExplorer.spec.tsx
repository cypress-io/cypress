import { mount } from '@cypress/react'
import React from 'react'
import { FileExplorer } from './FileExplorer'
import { File, FileLike, Folder } from './types'

const files: FileLike[] = [
  {
    relative: 'foo/bar/foo.spec.js',
    absolute: 'Users/code/foo/bar/foo.spec.js',
    name: 'foo/bar/foo.spec.js',
    onClick: (e, foo) => {
    },
    isOpen: false,
  },
  {
    relative: 'bar/foo.spec.tsx',
    absolute: 'bar/foo.spec.tsx',
    name: 'bar/foo.spec.tsx',
    isOpen: false,
  },
  {
    relative: 'merp/foo.spec.ts',
    absolute: 'merp/foo.spec.ts',
    name: 'merp/foo.spec.ts',
    isOpen: false,
  },
]

describe('FileExplorer', () => {
  it('renders', () => {
    const folderToggleSpy = cy.stub()
    const onFolderToggle = (folder: Folder) => {
      console.log(folder)
      folderToggleSpy()
    }

    const fileToggleSpy = cy.stub()
    const onFileSelect = (file: File) => {
      console.log(file)
      fileToggleSpy()
    }

    mount(
      <FileExplorer
        files={files}
        onFolderToggle={onFolderToggle}
        onFileSelect={onFileSelect}
      />,
    )
  })
})
