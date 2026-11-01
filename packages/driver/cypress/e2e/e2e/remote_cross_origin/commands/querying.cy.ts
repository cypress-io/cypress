describe('remote driver: querying a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.get()', () => {
    cy.get('#input').should('exist')
  })

  it('.contains()', () => {
    cy.contains('Nested Find').should('have.id', 'nested-find')
  })

  it('.getByRole()', () => {
    cy.getByRole('button', { name: 'get ajax' }).should('have.length', 1)
  })

  it('.within()', () => {
    cy.get('#by-id').within(() => {
      cy.get('#input').should('exist')
    })
  })

  it('.root()', () => {
    cy.root().should('match', 'html')
  })

  context('the runner', { defaultCommandTimeout: 500 }, () => {
    it('does not get elements in the runner', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find element: `h1`, but never found it.')

        done()
      })

      cy.get('h1')
    })

    it('does not contain elements in the runner', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Expected to find content: \'SpecRunner\' but never did.')

        done()
      })

      cy.contains('SpecRunner')
    })
  })
})
