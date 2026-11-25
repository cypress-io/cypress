// set for the whole run by CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER, so this spec runs in both the default and experimental-driver runs
const experimentalDriver = Cypress.config('experimentalDriver' as keyof Cypress.Config) === true
const itWithExperimentalDriver = experimentalDriver ? it : it.skip
const itWithLegacyDriver = experimentalDriver ? it.skip : it

describe('driver basics', () => {
  beforeEach(() => {
    cy.visit('/fixtures/experimental-driver.html')
  })

  it('gets elements and asserts on them', () => {
    cy.get('h1').should('have.text', 'Experimental driver')
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
})

describe('cross-origin AUT', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3500/fixtures/experimental-driver.html')
    cy.get('#cross-origin-link').click()
  })

  itWithExperimentalDriver('runs queries, actions and assertions without cy.origin', () => {
    cy.url().should('eq', 'http://www.foobar.com:3500/fixtures/experimental-driver.html')

    cy.get('#increment').click()
    cy.get('#count').should('have.text', '1')

    cy.get('#name').type('cross origin').should('have.value', 'cross origin')
    cy.contains('li', 'Two').should('have.class', 'two')
  })

  itWithLegacyDriver('needs cy.origin with the legacy driver', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('but the application is at origin `http://www.foobar.com:3500`')

      done()
    })

    cy.get('#increment')
  })
})

describe('legacy driver: iframes in the AUT', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3500/fixtures/experimental-driver-frames.html')
  })

  itWithLegacyDriver('reaches a same-origin iframe only through its contentDocument', () => {
    cy.get('#same').its('0.contentDocument.body').find('#label').should('have.text', 'same-origin')
  })

  itWithLegacyDriver('cannot reach a cross-origin iframe', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('contentDocument')
      done()
    })

    cy.get('#cross').its('0.contentDocument.body', { timeout: 500 })
  })
})

describe('legacy driver: experimental driver queries', () => {
  itWithLegacyDriver('does not register .tab() or .frame()', () => {
    expect('tab' in cy, 'cy.tab').to.be.false
    expect('frame' in cy, 'cy.frame').to.be.false
    expect('frame' in cy.wrap(null), '.frame() on a chain').to.be.false
  })
})
