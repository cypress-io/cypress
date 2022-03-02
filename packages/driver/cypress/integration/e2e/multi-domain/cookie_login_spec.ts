// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - cookie login', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  const verifyLoggedIn = (username) => {
    cy.get('h1')
    .invoke('text')
    .should('equal', `Welcome, ${username}!`)
  }

  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('[data-cy="login"]').click()
  })

  it('works with no SameSite, no Secure', () => {
    cy.switchToDomain('http://foobar.com', () => {
      cy.get('[data-cy="username"]').type('AJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('AJohnson')
  })

  it('works with SameSite=None, Secure', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="sameSite"]').select('None')
      cy.get('[data-cy="secure"]').check()
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('BJohnson')
  })

  it('works with SameSite=None, no Secure', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="sameSite"]').select('None')
      cy.get('[data-cy="username"]').type('CJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('CJohnson')
  })

  it('works with SameSite=Lax, Secure', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="sameSite"]').select('Lax')
      cy.get('[data-cy="secure"]').check()
      cy.get('[data-cy="username"]').type('DJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('DJohnson')
  })

  it('works with SameSite=Strict, Secure', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="sameSite"]').select('Strict')
      cy.get('[data-cy="secure"]').check()
      cy.get('[data-cy="username"]').type('EJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('EJohnson')
  })

  it('works with invalid SameSite, Secure', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('[data-cy="sameSite"]').select('Invalid')
      cy.get('[data-cy="secure"]').check()
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()
    })

    verifyLoggedIn('FJohnson')
  })
})
