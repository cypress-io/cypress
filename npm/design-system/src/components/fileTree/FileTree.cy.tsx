import React from 'react'
import { mount } from '@cypress/react'
import { FileTree } from './FileTree'
import { mountAndSnapshot } from 'util/testing'

const files = [
  {
    path: 'foo/bar/foo.spec.js',
  },
  {
    path: 'qux/dog.spec.tsx',
  },
  {
    path: 'merp/cat.spec.ts',
  },
]

const assertSelectedBorder = ($els: JQuery<HTMLElement>) => {
  const win = $els[0].ownerDocument.defaultView

  if (win) {
    const after = win.getComputedStyle($els[0], 'after')

    // Verify that we see at least some border, indicating it is highlighted
    const leftStyle = after.getPropertyValue('border-left-style')

    expect(leftStyle).to.eq('solid')

    const leftWidth = after.getPropertyValue('border-left-width')

    expect(leftWidth).to.eq('2px')
  }
}

beforeEach(() => {
  cy.viewport(500, 500)
})

describe('FileTree', () => {
  it('should send onFilePress callback on space and enter', () => {
    const filePressStub = cy.stub()

    mountAndSnapshot(
      <div style={{ height: 500, width: 500 }}>
        <FileTree files={files} rootDirectory="/" emptyPlaceholder="No specs found" onFilePress={filePressStub} />
      </div>,
    )

    // Click on the "foo" directory
    cy.get('div').contains('foo').click()

    // navigate to "qux"
    cy.focused().type('{downarrow}')
    cy.get('div').contains('dog.spec.tsx').should('exist')

    // collapse "qux", hiding "dog.spec.tsx"
    cy.focused().type('{enter}')
    cy.get('div').contains('dog.spec.tsx').should('not.exist')

    // uncollapse "qux", revealing "dog.spec.tsx"
    cy.focused().type('{enter}')
    cy.get('div').contains('dog.spec.tsx').should('exist')

    // navigate to "dog.spec.tsx"
    cy.focused().type('{downarrow}')
    cy.focused().type(' ').then(() => {
      expect(filePressStub).to.have.been.callCount(1)
    })

    cy.focused().type('{uparrow}')
    cy.focused().type('{uparrow}')

    cy.focused().should('contain', 'foo/bar')
  })

  describe('focus', () => {
    it('should automatically focus the first row when focused', () => {
      mount(
        <div style={{ height: 500, width: 500 }}>
          <FileTree files={files} rootDirectory="/" emptyPlaceholder="No specs found" />
        </div>,
      )

      cy.get('[data-cy=virtualized-tree]').focus()

      cy.contains('.treeChild', '/').then(assertSelectedBorder)
    })

    it('should preserve focus state', () => {
      mount(
        <div>
          <div style={{ height: 500, width: 500 }}>
            <FileTree files={files} rootDirectory="/" emptyPlaceholder="No specs found" />
          </div>
          <button>Test</button>
        </div>,
      )

      cy.get('[data-cy=virtualized-tree]').focus().type('{downarrow}').type('{downarrow}')

      cy.get('button').focus()

      cy.get('[data-cy=virtualized-tree]').focus()

      cy.contains('.treeChild', 'foo.spec.js').then(assertSelectedBorder)
    })

    it('should scroll to item on keyboard input', () => {
      const files = []

      for (let i = 0; i < 100; i++) {
        files.push({ path: `File ${i}` })
      }

      mount(
        <div style={{ height: 500, width: 500 }}>
          <FileTree files={files} rootDirectory="/" emptyPlaceholder="No specs found" />
        </div>,
      )

      cy.get('[data-cy=virtualized-tree]').focus().type('{downarrow}').type('{downarrow}')

      cy.get('[data-cy=virtualized-tree] > div').scrollTo('bottom')

      cy.contains('.treeChild', 'File 99').should('be.visible')

      cy.get('[data-cy=virtualized-tree]').focus().type('{downarrow}').type('{downarrow}')

      cy.contains('.treeChild', 'File 3').should('be.visible')
    })
  })
})
