describe('independent wait response phase budgets', { retries: 0 }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/empty.html')
  })

  const startPair = (secondRequestDelay: number) => {
    cy.intercept('GET', '/phase-a', { delay: 250, body: 'a' }).as('phaseA')
    cy.intercept('GET', '/phase-b', { delay: 250, body: 'b' }).as('phaseB')
    cy.window().then((win) => {
      win.fetch('/phase-a')
      win.setTimeout(() => {
        win.fetch('/phase-b')
      }, secondRequestDelay)
    })
  }

  for (const delay of [0, 300]) {
    it(`gives each response a fresh budget with a ${delay}ms second request delay`, () => {
      startPair(delay)
      cy.wait(['@phaseA', '@phaseB'], { requestTimeout: 500, responseTimeout: 400 }).then((responses) => {
        expect(responses[0].response?.body).to.eq('a')
        expect(responses[1].response?.body).to.eq('b')
      })
    })
  }

  it('still rejects a response that exceeds its own budget', (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.include('400ms')
      expect(err.message).to.include('phaseB')
      done()

      return false
    })

    cy.intercept('GET', '/phase-b', { delay: 650, body: 'late' }).as('phaseB')
    cy.window().then((win) => {
      win.setTimeout(() => {
        win.fetch('/phase-b')
      }, 300)
    })

    cy.wait('@phaseB', { requestTimeout: 500, responseTimeout: 400 })
  })
})
