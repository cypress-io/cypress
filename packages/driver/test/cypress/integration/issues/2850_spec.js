// https://github.com/cypress-io/cypress/issues/2850
describe('issue #2850: invoking cy.clock() before two visits', () => {
  it('works the first time', () => {
    cy.clock()
    cy.visit('/fixtures/generic.html')
    cy.window().then((win) => {
      // override the setTimeout function now
      win.setTimeout = () => {}
    })
  })

  it('works the second time', () => {
    cy.clock()
    cy.visit('/fixtures/generic.html')
  })

  it('works the third time', () => {
    cy.clock().then((clock) => {
      cy.visit('/fixtures/generic.html')
      cy.window().then((win) => {
        // override the setTimeout function now
        win.setTimeout = () => { }

        // manually restore the clock
        clock.restore()
      })

      cy.clock().then((clock2) => {
        clock2.restore()
      })
    })
  })

  it('works the forth time', () => {
    cy.clock()
    cy.visit('/fixtures/generic.html')
  })
})
