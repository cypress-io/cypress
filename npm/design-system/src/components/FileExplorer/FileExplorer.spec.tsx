import { mount } from '@cypress/react'
import React from 'react'
import { FileExplorer, FileComponentProps, FolderComponentProps } from './FileExplorer'
import { makeFileHierarchy } from './helpers/makeFileHierarchy'
import { File, Folder } from './types'

import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'
import folderClosed from '@iconify/icons-vscode-icons/default-folder'
import folderOpen from '@iconify/icons-vscode-icons/default-folder-opened'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)


const icons: Record<string, any> = {
  js: { icon: javascriptIcon },
  ts: { icon: typescriptIcon },
  tsx: { icon: reactTs },
  jsx: { icon: reactJs },
  folderOpen: { icon: folderOpen },
  folderClosed: { icon: folderClosed },
}

describe('FileExplorer', () => {
  it('renders', () => {

    const Wrapper: React.FC = () => {
      let specs: Cypress.Cypress['spec'][] = [
        {
          relative: 'foo/bar/foo.spec.js',
          absolute: 'Users/code/foo/bar/foo.spec.js',
          name: 'foo/bar/foo.spec.js',
        },
        {
          relative: 'bar/foo.spec.tsx',
          absolute: 'bar/foo.spec.tsx',
          name: 'bar/foo.spec.tsx',
        },
        {
          relative: 'merp/foo.spec.ts',
          absolute: 'merp/foo.spec.ts',
          name: 'merp/foo.spec.ts',
        },
      ]

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

      const files = makeFileHierarchy(specs.map(spec => spec.relative))

      const getExt = (path: string) => {
        const extensionMatches = path.match(/(?:\.([^.]+))?$/)
        return extensionMatches ? extensionMatches[1] : ''
      }

      const FileComponent: React.FC<FileComponentProps> = props => {
        const ext = getExt(props.item.name)
        const inlineIconProps = ext && icons[ext]

        return (
          <div onClick={() => props.onClick(props.item)}>
            {<InlineIcon {...inlineIconProps} />}
            {props.item.name}
          </div>
        )
      }

      const FolderComponent: React.FC<FolderComponentProps> = props => {
        const inlineIconProps = props.isOpen ? icons.folderOpen : icons.folderClosed
        return (
          <div onClick={props.onClick}>
            <InlineIcon {...inlineIconProps} />
            {props.item.name}
          </div>
        )
      }

      return (
        <FileExplorer
          files={files}
          fileComponent={FileComponent}
          folderComponent={FolderComponent}
        />
      )
    }

    mount(<Wrapper />)
  })
})
