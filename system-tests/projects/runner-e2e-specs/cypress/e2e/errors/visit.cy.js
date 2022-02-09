describe('cy.visit', () => {
  it('onBeforeLoad assertion failure', () => {
    cy.visit('cypress/fixtures/index.html', {
      onBeforeLoad () {
        expect('actual').to.equal('expected')
      },
    })
  })

  it('onBeforeLoad exception', () => {
    cy.visit('cypress/fixtures/index.html', {
      onBeforeLoad () {
        ({}).bar()
      },
    })
  })

  it('onLoad assertion failure', () => {
    cy.visit('cypress/fixtures/index.html', {
      onLoad () {
        expect('actual').to.equal('expected')
      },
    })
  })

  it('onLoad exception', () => {
    cy.visit('cypress/fixtures/index.html', {
      onLoad () {
        ({}).bar()
      },
    })
  })
})
