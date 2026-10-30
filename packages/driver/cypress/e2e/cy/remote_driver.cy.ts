const runCases = () => {
  beforeEach(() => {
    cy.visit('/fixtures/remote-driver.html')
  })

  it('gets elements and asserts on them', () => {
    cy.get('h1').should('have.text', 'Remote driver')
    cy.get('h1').should('have.class', 'main').and('have.attr', 'data-test', 'heading')
    cy.get('#list li').should('have.length', 3)
    cy.get('#hidden').should('be.hidden')
    cy.get('#increment').should('be.visible')
    cy.get('#disabled').should('be.disabled')
    cy.get('#missing').should('not.exist')
  })

  it('chains find, eq and contains', () => {
    cy.get('#list').find('li').eq(1).should('have.class', 'two')
    cy.contains('Three').should('have.class', 'item')
    cy.get('#list').contains('li', 'Two').should('have.text', 'Two')
  })

  it('clicks', () => {
    cy.get('#increment').click()
    cy.get('#increment').click()
    cy.get('#count').should('have.text', '2')

    cy.get('#agree').click().should('be.checked')
  })

  it('types', () => {
    cy.get('#name').type('hello').should('have.value', 'hello')
    cy.get('#typed').should('have.text', 'hello')
  })

  it('retries until an element appears', () => {
    cy.get('#reveal').click()
    cy.get('#late').should('be.visible').and('contain', 'Arrived')
  })

  it('reports a missing element the same way', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Expected to find element: `#missing`, but never found it.')

      done()
    })

    cy.get('#missing', { timeout: 200 })
  })

  it('refuses to click a disabled button', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('failed because this element is `disabled`')

      done()
    })

    cy.get('#disabled').click({ timeout: 200 })
  })
}

describe('experimentalRemoteDriver', () => {
  describe('legacy driver', { experimentalRemoteDriver: false }, runCases)

  describe('remote driver', { experimentalRemoteDriver: true }, runCases)

  describe('cross-origin AUT', () => {
    beforeEach(() => {
      cy.visit('/fixtures/remote-driver.html')
      cy.get('#cross-origin-link').click()
    })

    it('runs queries, actions and assertions without cy.origin', { experimentalRemoteDriver: true }, () => {
      cy.url().should('eq', 'http://www.foobar.com:3500/fixtures/remote-driver.html')

      cy.get('#increment').click()
      cy.get('#count').should('have.text', '1')

      cy.get('#name').type('cross origin').should('have.value', 'cross origin')
      cy.contains('li', 'Two').should('have.class', 'two')
    })

    it('needs cy.origin with the legacy driver', { experimentalRemoteDriver: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('but the application is at origin `http://www.foobar.com:3500`')

        done()
      })

      cy.get('#increment')
    })
  })
})
