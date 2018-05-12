/// <reference types="Cypress" />

context('Spies, Stubs, and Clock', () => {
  it('cy.spy() - wrap a method in a spy', () => {
    // https://on.cypress.io/spy
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

    let obj = {
      foo () {},
    }

    let spy = cy.spy(obj, 'foo').as('anyArgs')

    obj.foo()

    expect(spy).to.be.called
  })

  it('cy.stub() - create a stub and/or replace a function with stub', () => {
    // https://on.cypress.io/stub
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

    let obj = {
      foo () {},
    }

    let stub = cy.stub(obj, 'foo').as('foo')

    obj.foo('foo', 'bar')

    expect(stub).to.be.called
  })

  it('cy.clock() - control time in the browser', () => {
    // https://on.cypress.io/clock

    // create the date in UTC so its always the same
    // no matter what local timezone the browser is running in
    let now = new Date(Date.UTC(2017, 2, 14)).getTime()

    cy.clock(now)
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')
    cy.get('#clock-div').click()
      .should('have.text', '1489449600')
  })

  it('cy.tick() - move time in the browser', () => {
    // https://on.cypress.io/tick

    // create the date in UTC so its always the same
    // no matter what local timezone the browser is running in
    let now = new Date(Date.UTC(2017, 2, 14)).getTime()

    cy.clock(now)
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')
    cy.get('#tick-div').click()
      .should('have.text', '1489449600')
    cy.tick(10000) // 10 seconds passed
    cy.get('#tick-div').click()
      .should('have.text', '1489449610')
  })
})
