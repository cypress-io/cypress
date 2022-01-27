// Iterates over a provided spec tree and performs assertions related to collapsibility
// within the command log.
const validateCollapsibleSpecTree = (nodes) => {
  if (!nodes || !nodes.length) {
    return
  }

  nodes.forEach((node) => {
    let childNodes = node.children || []

    // assert visibility of tree node and its children
    // nodes without children represent it statements; these are collapsed initially
    cy.findByRole('button', { name: node.name, expanded: !!node.children }).should('be.visible')
    childNodes.forEach((childNode) => {
      cy.findByRole('button', { name: childNode.name }).should('be.visible')
    })

    // assert selecting node collapses it
    cy.findByRole('button', { name: node.name, expanded: !!childNodes.length })
    .click()
    .should('have.attr', 'aria-expanded', `${!childNodes.length}`)

    // assert non-existance of child nodes when parent is collapsed
    childNodes.forEach((childNode) => {
      cy.findByRole('button', { name: childNode.name }).should('not.exist')
    })

    // assert selecting node again expands it
    cy.findByRole('button', { name: node.name, expanded: !childNodes.length }).click()
    .should('have.attr', 'aria-expanded', `${!!childNodes.length}`)

    // assert expanded node renders children again in their previous state
    childNodes.forEach((childNode) => {
      cy.findByRole('button', { name: childNode.name }).should('be.visible')
    })

    // assert that child nodes behave similarly to their parent
    validateCollapsibleSpecTree(childNodes)
  })
}

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
      cy.wait('@OpenIDE').then(({ request }) => {
        expect(request.body.variables.input.absolute).to.include('command-log-e2e-specs/cypress/e2e/cypress_tests.cy.js')
        expect(request.body.variables.input.column).to.eq(0)
        expect(request.body.variables.input.line).to.eq(0)
      })

      cy.findByTestId('spec-duration').should('be.visible').then(($element) => {
        expect($element[0].textContent).not.to.be.undefined // TODO determine method for mocking this?
      })
    })
  })

  it('shows each spec suite in an ordered collapsible group', () => {
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

      validateCollapsibleSpecTree(specShape)
    })
  })

  it('shows each spec as its own collapsible group', () => {
    // wait for all tests to succeed
    cy.findByLabelText('Stats').get('.passed', { timeout: 10000 }).should('have.text', 'Passed:4')

    cy.get('#unified-reporter').within(() => {
      cy.findByRole('button', { name: 'should perform test 1 passed', expanded: false }).click()

      cy.findByRole('button', { name: 'before each', expanded: true }).as('BeforeEachHook').should('be.visible')
      cy.findByRole('button', { name: 'test body', expanded: true }).as('TestBodyHook').should('be.visible')
    })
  })

  it('shows open in IDE button for blocks within an individual spec', () => {
    // wait for all tests to succeed
    cy.findByLabelText('Stats').get('.passed', { timeout: 10000 }).should('have.text', 'Passed:4')

    cy.findByRole('button', { name: 'should perform test 1 passed', expanded: false }).click()

    cy.intercept('mutation-OpenFileInIDE', { data: { 'openFileInIDE': true } }).as('OpenIDE')

    // assert IDE button for beforeEach performs the correct mutation
    cy.findByRole('button', { name: 'before each' }).siblings().eq(0)
    .findByText('Open in IDE').click({ force: true })

    cy.wait('@OpenIDE').then(({ request }) => {
      expect(request.body.variables.input.absolute).to.include('command-log-e2e-specs/cypress/e2e/cypress_tests.cy.js')
      expect(request.body.variables.input.column).to.eq(3)
      expect(request.body.variables.input.line).to.eq(2)
    })

    // assert IDE button for test body performs the correct mutation
    cy.findByRole('button', { name: 'test body' }).siblings().eq(0)
    .findByText('Open in IDE').click({ force: true })

    cy.wait('@OpenIDE').then(({ request }) => {
      expect(request.body.variables.input.absolute).to.include('command-log-e2e-specs/cypress/e2e/cypress_tests.cy.js')
      expect(request.body.variables.input.column).to.eq(7)
      expect(request.body.variables.input.line).to.eq(8)
    })
  })
})
