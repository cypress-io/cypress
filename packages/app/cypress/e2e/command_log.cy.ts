describe('Command Log', {
  viewportHeight: 768,
  viewportWidth: 1024,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('command-log-e2e-specs')
    cy.openProject('command-log-e2e-specs')

    // set preferred editor to bypass IDE selection dialog
    cy.withCtx((ctx) => {
      ctx.coreData.localSettings.availableEditors = [
        ...ctx.coreData.localSettings.availableEditors,
        {
          id: 'test-editor',
          binary: '/usr/bin/test-editor',
          name: 'Test editor',
        },
      ]

      ctx.coreData.localSettings.preferences.preferredEditorBinary = 'test-editor'
    })

    cy.startAppServer()
    cy.visitApp()

    cy.findByRole('link', { name: 'cypress_tests.cy.js' }).click()

    cy.location().should((location) => {
      expect(location.hash).to.contain('cypress_tests.cy')
    })
  })

  it('shows runnable header with name and runtime', () => {
    cy.intercept('mutation-OpenFileInIDE', { data: { 'openFileInIDE': true } }).as('OpenIDE')

    cy.findByTestId('runnable-header').within(() => {
      cy.findByRole('link', { name: 'cypress_tests.cy.js' }).should('be.visible').click()
      cy.wait('@OpenIDE')

      cy.findByTestId('spec-duration').should('be.visible').then(($element) => {
        expect($element[0].textContent).not.to.be.undefined // TODO determine method for mocking this?
      })
    })
  })

  const validateCollapsibleTree = (nodes) => {
    if (!nodes) {
      return
    }

    nodes.forEach((node) => {
      // assert visibility of tree node and its children
      // nodes without children represent it statements; these collapsed initially
      cy.findByRole('button', { name: node.name, expanded: !!node.children }).should('be.visible')
      if (node.children) {
        node.children.forEach((childNode) => {
          cy.findByRole('button', { name: childNode.name }).should('be.visible')
        })
      }

      // assert selecting node collapses it
      cy.findByRole('button', { name: node.name, expanded: !!node.children })
      .click()
      .should('have.attr', 'aria-expanded', `${!node.children}`)

      // assert non-existance of child nodes when parent is collapsed
      if (node.children) {
        node.children.forEach((childNode) => {
          cy.findByRole('button', { name: childNode.name }).should('not.exist')
        })
      }

      // assert selecting node again expands it
      cy.findByRole('button', { name: node.name, expanded: !node.children }).click()
      .should('have.attr', 'aria-expanded', `${!!node.children}`)

      // assert expanded node renders children again in their previous state
      if (node.children) {
        node.children.forEach((childNode) => {
          cy.findByRole('button', { name: childNode.name }).should('be.visible')
        })

        // assert that child nodes behave similarly to their parent
        validateCollapsibleTree(node.children)
      }
    })
  }

  it('shows each spec suite in a collapsible group', () => {
    // wait for all tests to succeed
    cy.findByLabelText('Stats').get('.passed', { timeout: 10000 }).should('have.text', 'Passed:4')

    cy.get('#unified-reporter').within(() => {
      const specShape = [{
        name: 'Cypress Tests',
        children: [{
          name: 'Describe Block 1',
          children: [{
            name: 'Context Block A',
            children: [{
              name: 'should perform test 1 passed',
            }],
          }, {
            name: 'Context Block B',
            children: [{
              name: 'should perform test 2 passed',
            }],

          }],
        }, {
          name: 'Describe Block 2',
          children: [{
            name: 'Context Block C',
            children: [{
              name: 'should perform test 3 passed',
            }],
          }, {
            name: 'Context Block D',
            children: [{
              name: 'should perform test 4 passed',
            }],
          }],
        }],
      }]

      validateCollapsibleTree(specShape)
    })
  })
})
