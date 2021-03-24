/// <reference types="cypress-real-events" />
import { mount } from '@cypress/react'
import * as React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { FileNode } from '../../src/app/SpecList/makeFileHierarchy'
import { SpecList } from '../../src/app/SpecList/SpecList'

// Need to register these here.
// They are registered once per app, in this case in RunnerCt.
library.add(fas)
library.add(fab)

const specs: Cypress.Cypress['spec'][] = [
  {
    relative: 'foo/bar/foo.spec.js',
    absolute: 'Users/code/foo/bar/foo.spec.js',
    name: 'foo/bar/foo.spec.js',
  },
  {
    relative: 'qux/dog.spec.tsx',
    absolute: 'qux/dog.spec.tsx',
    name: 'qux/dog.spec.tsx',
  },
  {
    relative: 'merp/cat.spec.ts',
    absolute: 'merp/cat.spec.ts',
    name: 'merp/cat.spec.ts',
  },
]

const styles = `
  .fa-search {
    width: 1em;
  }

  .fa-times {
    width: 0.65em;
  }
`

describe('SpecList', () => {
  const createSpecList = (selectStub: typeof cy.stub, focusSpecListStub: typeof cy.stub): React.FC => {
    return () => {
      const [selectedFile, setSelectedFile] = React.useState<string>()

      const onFileClick = (file: FileNode) => {
        selectStub(file)
        setSelectedFile(file.relative)
      }

      return (
        <SpecList
          specs={specs}
          focusSpecList={focusSpecListStub}
          selectedFile={selectedFile}
          searchRef={React.useRef(null)}
          onFileClick={onFileClick}
        />
      )
    }
  }

  it('renders and selects a file', () => {
    const selectStub = cy.stub()
    const Subject = createSpecList(selectStub, cy.stub())

    mount(<Subject />, { styles })

    cy.get('div').contains('dog.spec.tsx').click().then(() => {
      expect(selectStub).to.have.been.calledWith({
        type: 'file',
        relative: 'qux/dog.spec.tsx',
        name: 'dog.spec.tsx',
      })
    })
  })

  it('closes a folder', () => {
    const Subject = createSpecList(cy.stub(), cy.stub())

    mount(<Subject />, { styles })

    cy.get('div').contains('dog.spec.tsx').should('exist')

    // qux folder contains dog.spec.tsx. If we close it, it should not exist anymore.
    cy.get('div').contains('qux').click().then(() => {
      cy.get('div').contains('dog.spec.tsx').should('not.exist')
    })
  })

  it('navigates with arrow keys', () => {
    const selectStub = cy.stub()
    const focusSearchStub = cy.stub()
    const Subject = createSpecList(selectStub, focusSearchStub)

    mount(<Subject />, { styles })

    // close the "foo" directory
    cy.get('div').contains('foo').click()

    // navigate to "qux"
    cy.realPress('ArrowDown')
    cy.get('div').contains('dog.spec.tsx').should('exist')

    // collapse "qux", hiding "dog.spec.tsx"
    cy.realPress('{enter}')
    cy.get('div').contains('dog.spec.tsx').should('not.exist')

    // uncollapse "qux", revealing "dog.spec.tsx"
    cy.realPress('{enter}')
    cy.get('div').contains('dog.spec.tsx').should('exist')

    // navigate to "dog.spec.tsx"
    cy.realPress('ArrowDown')
    cy.realPress('{enter}').then(() => {
      expect(selectStub).to.have.been.calledWith({
        type: 'file',
        relative: 'qux/dog.spec.tsx',
        name: 'dog.spec.tsx',
      })
    })

    // navigate to "qux"
    cy.realPress('ArrowUp')

    // navigate to "foo"
    cy.realPress('ArrowUp')

    // pressing up on the first spec should focus the search input
    cy.realPress('ArrowUp').then(() => {
      expect(focusSearchStub).to.have.been.calledWith()
    })
  })

  it('does fuzzy seach and highlighting', () => {
    const Subject = createSpecList(cy.stub(), cy.stub())

    mount(<Subject />, { styles })

    cy.get('[placeholder="Find spec..."').click()

    // all specs visible initially.
    cy.get('div').contains('foo.spec.js').should('exist')
    cy.get('div').contains('dog.spec.tsx').should('exist')
    cy.get('div').contains('cat.spec.ts').should('exist')

    // find via folder + file combination. rp from merp, cat.ts from cat.spec.ts.
    cy.realType('rpcat.ts')

    cy.get('div').contains('foo.spec.js').should('not.exist')
    cy.get('div').contains('dog.spec.tsx').should('not.exist')
    cy.get('div').contains('cat.spec.ts').should('exist')

    // the found characters, cat.ts, should be bold via <b>
    ;['r', 'p', 'c', 'a', 't', '.', 't', 's'].forEach((char) => {
      cy.get('[data-item="merp/cat.spec.ts"]').get('b').contains(char)
    })
  })

  it('clears search input when clicking X', () => {
    const Subject = createSpecList(cy.stub(), cy.stub())

    mount(<Subject />, { styles })
    cy.get('[placeholder="Find spec..."').click()
    cy.get('input').should('not.have.value', 'spec')
    cy.realType('spec')
    cy.get('input').should('have.value', 'spec')

    cy.get('[data-icon="times"]').click()
    cy.get('input').should('not.have.value', 'spec')
  })
})
