import { mount } from '@cypress/react'
import React from 'react'
import { FileExplorer, FileComponentProps, FolderComponentProps } from './FileExplorer'
import { FileNode, makeFileHierarchy, TreeNode } from './helpers/makeFileHierarchy'

import styles from './FileExplorer.module.scss'

const specs: Cypress.Cypress['spec'][] = [
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
    relative: 'merp/map.spec.ts',
    absolute: 'merp/map.spec.ts',
    name: 'merp/map.spec.ts',
  },
]

interface FileExplorerTestProps {
  clickFileStub: typeof cy.stub
  clickFolderStub: typeof cy.stub
}

function createFileExplorer (testProps: FileExplorerTestProps): React.FC {
  return () => {
    const [selectedFile, setSelectedFile] = React.useState<string>()

    const onFileClick = (file: FileNode) => {
      setSelectedFile(file.absolute)
    }

    const files = makeFileHierarchy(specs.map((spec) => spec.relative))

    const FileComponent: React.FC<FileComponentProps> = (props) => {
      return (
        <div onClick={() => {
          testProps.clickFileStub(props.item)
          props.onClick(props.item)
        }}>
          {props.item.name}
        </div>
      )
    }

    const FolderComponent: React.FC<FolderComponentProps> = (props) => {
      return (
        <div onClick={() => {
          testProps.clickFolderStub()
          props.onClick()
        }}>
          {props.item.name}
        </div>
      )
    }

    return (
      <FileExplorer
        files={files}
        cssModule={styles}
        selectedFile={selectedFile}
        fileComponent={FileComponent}
        folderComponent={FolderComponent}
        onFileClick={onFileClick}
      />
    )
  }
}

describe('FileExplorer', () => {
  it('basic usage', () => {
    const files: TreeNode[] = [
      {
        type: 'folder',
        name: 'foo',
        absolute: 'foo',
        files: [
          {
            type: 'file',
            name: 'bar.js',
            absolute: 'foo/bar.js',
          },
        ],
      },
    ]

    const FileComponent: React.FC<FileComponentProps> = (props) => <div>{props.item.name}</div>
    const FolderComponent: React.FC<FolderComponentProps> = (props) => <div>{props.item.name}</div>

    mount(
      <FileExplorer
        files={files}
        selectedFile={undefined}
        fileComponent={FileComponent}
        folderComponent={FolderComponent}
        onFileClick={() => {}}
      />,
    )
  })

  it('clicks file and folders', () => {
    const clickFolderStub = cy.stub()
    const clickFileStub = cy.stub()

    const Wrapper = createFileExplorer({
      clickFolderStub,
      clickFileStub,
    })

    mount(<Wrapper />)

    cy.get('div').contains('bar').click().then(() => {
      expect(clickFolderStub).to.have.been.calledWith()
    })

    cy.get('div').contains('map.spec.ts').click().then(() => {
      expect(clickFileStub).to.have.been.calledWith({
        type: 'file',
        absolute: 'merp/map.spec.ts',
        name: 'map.spec.ts',
      })
    })
  })
})
