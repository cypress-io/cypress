export {}

const setStorage = () => {
  cy.visit('http://localhost:3500/fixtures/set-storage.html?nums=1,2')
  cy.visit('http://www.foobar.com:3500/fixtures/set-storage.html?nums=3,4')
}

describe('remote driver: storage in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.getAllLocalStorage', () => {
    setStorage()

    cy.getAllLocalStorage().should('deep.include', {
      'http://localhost:3500': {
        key1: 'value1',
        key2: 'value2',
      },
      'http://www.foobar.com:3500': {
        key3: 'value3',
        key4: 'value4',
      },
    })
  })

  it('.clearAllLocalStorage', () => {
    setStorage()

    cy.clearAllLocalStorage()
    cy.getAllLocalStorage().should('deep.equal', {})
  })

  it('.getAllSessionStorage', () => {
    setStorage()

    cy.getAllSessionStorage().should('deep.include', {
      'http://www.foobar.com:3500': {
        key13: 'value13',
        key14: 'value14',
      },
    })
  })

  it('.clearAllSessionStorage', () => {
    setStorage()

    cy.clearAllSessionStorage()
    cy.getAllSessionStorage().should('deep.equal', {})
  })

  it('.clearLocalStorage()', () => {
    cy.document().invoke('defaultView.localStorage.setItem', 'foo', 'bar')
    cy.document().invoke('defaultView.localStorage.getItem', 'foo').should('equal', 'bar')

    cy.clearLocalStorage().should('be.null')
    cy.document().invoke('defaultView.localStorage.getItem', 'foo').should('be.null')
  })
})
