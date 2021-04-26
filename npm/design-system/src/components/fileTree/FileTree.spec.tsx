import React from 'react'
import { mount } from '@cypress/react'
import { FileTree } from '../../../dist'

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

describe('FileTree', () => {
  it('should send onFilePress callback on space and enter', () => {
    cy.viewport(500, 500)

    const filePressStub = cy.stub()

    mount(
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
})
