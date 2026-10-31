const CLOCK_PAGE = 'http://www.foobar.com:3500/fixtures/remote-driver-isolation.html'
const NEW_YEAR = Date.UTC(2020, 0, 1)

describe('remote driver: cy.clock', { experimentalRemoteDriver: true }, () => {
  it('freezes the AUT\'s time from before it loads', () => {
    cy.clock(NEW_YEAR)
    cy.visit(CLOCK_PAGE)
    cy.get('#loaded-at').should('have.text', String(NEW_YEAR))
  })

  it('ticks the AUT\'s timers', () => {
    cy.visit(CLOCK_PAGE)
    cy.clock()
    cy.get('#start-timer').click()
    cy.tick(999)
    cy.get('#timer-result').should('have.text', 'waiting')
    cy.tick(1)
    cy.get('#timer-result').should('have.text', 'fired')
  })

  it('sets the AUT\'s system time', () => {
    cy.visit(CLOCK_PAGE)
    cy.clock(0).then((clock) => {
      clock.setSystemTime(5000)
    })

    cy.get('#show-time').click()
    cy.get('#timer-result').should('have.text', 'now:5000')
  })

  it('restores the AUT\'s timers', () => {
    cy.visit(CLOCK_PAGE)
    cy.clock().then((clock) => {
      clock.restore()
    })

    cy.get('#start-timer').click()
    cy.get('#timer-result').should('have.text', 'fired')
  })

  it('leaves the next test with real timers', () => {
    cy.visit(CLOCK_PAGE)
    cy.get('#loaded-at').should('not.have.text', String(NEW_YEAR))
  })
})
