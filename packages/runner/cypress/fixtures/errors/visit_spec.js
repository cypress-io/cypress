import './setup'

describe('cy.visit', () => {
  it('onBeforeLoad assertion failure', () => {
    cy.visit('/index.html', {
      onBeforeLoad () {
        expect('actual').to.equal('expected')
      },
    })
  })

  it('onBeforeLoad exception', () => {
    cy.visit('/index.html', {
      onBeforeLoad () {
        ({}).bar()
      },
    })
  })

  it('onLoad assertion failure', () => {
    cy.visit('/index.html', {
      onLoad () {
        expect('actual').to.equal('expected')
      },
    })
  })

  it('onLoad exception', () => {
    cy.visit('/index.html', {
      onLoad () {
        ({}).bar()
      },
    })
  })
})
