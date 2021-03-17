/// <reference types="cypress-real-events" />
import { mount } from '@cypress/react'
import React from 'react'
import { FileNode } from '../FileExplorer/helpers/makeFileHierarchy'
import { SpecList } from './SpecList'

const specs: Cypress.Cypress['spec'][] = [
  {
    relative: 'foo/bar/foo.spec.js',
    absolute: 'Users/code/foo/bar/foo.spec.js',
    name: 'foo/bar/foo.spec.js',
  },
  {
    relative: 'qux/foo.spec.tsx',
    absolute: 'qux/foo.spec.tsx',
    name: 'qux/foo.spec.tsx',
  },
  {
    relative: 'merp/foo.spec.ts',
    absolute: 'merp/foo.spec.ts',
    name: 'merp/foo.spec.ts',
  },
]

describe('SpecList', () => {
  const createSpecList = (selectStub: typeof cy.stub): React.FC => {
    return () => {
      const [selectedFile, setSelectedFile] = React.useState<string>()

      const onFileClick = (file: FileNode) => {
        selectStub(file)
        setSelectedFile(file.absolute)
      }

      return (
        <SpecList
          specs={specs}
          onFileClick={onFileClick}
          selectedFile={selectedFile}
        />
      )
    }
  }

  it('renders and selects a file', () => {
    const selectStub = cy.stub()
    const Subject = createSpecList(selectStub)

    mount(<Subject />)

    cy.get('div').contains('foo.spec.tsx').click().then(() => {
      expect(selectStub).to.have.been.calledWith({
        type: 'file',
        absolute: 'qux/foo.spec.tsx',
        name: 'foo.spec.tsx',
      })
    })
  })

  it('closes a folder', () => {
    const Subject = createSpecList(cy.stub())

    mount(<Subject />)

    cy.get('div').contains('foo.spec.tsx').should('exist')

    // qux folder contains foo.spec.tsx. If we close it, it should not exist anymore.
    cy.get('div').contains('qux').click().then(() => {
      cy.get('div').contains('foo.spec.tsx').should('not.exist')
    })
  })

  it('navigates with arrow keys', () => {
    const selectStub = cy.stub()
    const Subject = createSpecList(selectStub)

    mount(<Subject />)

    // close the "foo" directory
    cy.get('div').contains('foo').click()

    // navigate to "qux"
    cy.realPress('ArrowDown')
    cy.get('div').contains('foo.spec.tsx').should('exist')

    // collapse "qux", hiding "foo.spec.tsx"
    cy.realPress('{enter}')
    cy.get('div').contains('foo.spec.tsx').should('not.exist')

    // uncollapse "qux", revealing "foo.spec.tsx"
    cy.realPress('{enter}')
    cy.get('div').contains('foo.spec.tsx').should('exist')

    // navigate to "foo.spec.tsx"
    cy.realPress('ArrowDown')
    cy.realPress('{enter}').then(() => {
      expect(selectStub).to.have.been.calledWith({
        type: 'file',
        absolute: 'qux/foo.spec.tsx',
        name: 'foo.spec.tsx',
      })
    })
  })
})
