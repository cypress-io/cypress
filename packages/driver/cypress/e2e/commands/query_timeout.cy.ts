describe('runtime query timeout configuration', { retries: 0 }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/empty.html')
  })

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000)
  })

  const insertLater = (timeout: number, delay: number) => {
    cy.window().then((win) => {
      Cypress.config('defaultCommandTimeout', timeout)
      win.setTimeout(() => {
        const element = win.document.createElement('p')

        element.textContent = 'delayed query target'
        win.document.body.appendChild(element)
      }, delay)
    })
  }

  it('uses a decreased runtime default', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.include('Timed out retrying after 500ms')
      done()

      return false
    })

    insertLater(500, 1000)
    cy.contains('delayed query target').should('be.visible')
  })

  it('uses an increased runtime default', { defaultCommandTimeout: 500 }, () => {
    insertLater(2000, 1000)
    cy.contains('delayed query target').should('be.visible')
  })

  it('preserves an explicit timeout longer than the runtime default', { defaultCommandTimeout: 4000 }, () => {
    insertLater(100, 500)
    cy.contains('delayed query target', { timeout: 2000 }).should('be.visible')
  })

  it('preserves an explicit timeout shorter than the runtime default', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.include('Timed out retrying after 100ms')
      done()

      return false
    })

    insertLater(2000, 500)
    cy.contains('delayed query target', { timeout: 100 }).should('be.visible')
  })
})
