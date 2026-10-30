const TABS_PAGE = 'http://localhost:3500/fixtures/remote-driver-tabs.html'

describe('remote driver: tabs the AUT opens', { browser: '!electron', experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit(TABS_PAGE)
  })

  it('signs in through a cross-origin popup that closes itself', () => {
    cy.get('#open').click()
    cy.tab(/foobar\.com/).find('#label').should('have.text', 'popup')
    cy.tab(/foobar\.com/).find('#username').type('ada')
    cy.tab(/foobar\.com/).contains('button', 'Sign in').click()
    cy.tab(/foobar\.com/).should('not.exist')
    cy.get('#status').should('have.text', 'Signed in as ada')
  })

  it('drives a target=_blank tab, then the AUT again', () => {
    cy.get('#blank').click()
    cy.tab('label=blank').find('#username').type('grace').should('have.value', 'grace')
    cy.get('#open').should('be.visible')
    cy.get('#status').should('have.text', 'Signed out')
  })

  it('uses the newest tab when no URL is given', () => {
    cy.get('#blank').click()
    cy.tab().find('#label').should('have.text', 'blank')
    cy.get('#open').click()
    cy.tab().find('#label').should('have.text', 'popup')
  })

  it('waits for a tab that opens later', () => {
    cy.get('#open-late').click()
    cy.tab(/foobar\.com/).find('#label').should('have.text', 'popup')
  })

  it('reports a missing tab', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Expected to find element: `a tab matching nowhere`, but never found it.')

      done()
    })

    cy.tab('nowhere', { timeout: 200 })
  })
})

describe('remote driver: tabs in Electron', { browser: 'electron', experimentalRemoteDriver: true }, () => {
  it('fails clearly', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.tab()` is not supported in Electron yet.')

      done()
    })

    cy.visit(TABS_PAGE)
    cy.tab().find('#username').click()
  })
})

describe('legacy driver: tabs', { experimentalRemoteDriver: false }, () => {
  it('.tab() requires experimentalRemoteDriver', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.tab()` requires `experimentalRemoteDriver` to be enabled.')

      done()
    })

    cy.tab()
  })
})
