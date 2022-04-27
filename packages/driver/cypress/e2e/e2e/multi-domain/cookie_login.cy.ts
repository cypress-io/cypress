describe('cy.origin - cookie login', () => {
  const verifyLoggedIn = (username) => {
    cy.get('h1')
    .invoke('text')
    .should('equal', `Welcome, ${username}!`)
  }

  it('works in a session', () => {
    cy.session('ZJohnson', () => {
      cy.visit('/fixtures/multi-domain.html')
      cy.get('[data-cy="cookie-login"]').click()
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('ZJohnson')
        cy.get('[data-cy="login"]').click()
      })
    }, {
      validate () {
        cy.getCookie('user').its('value').should('equal', 'ZJohnson')
      },
    })

    cy.visit('/welcome')
    verifyLoggedIn('ZJohnson')
  })

  describe('SameSite handling', () => {
    beforeEach(() => {
      cy.visit('/fixtures/multi-domain.html')
      cy.get('[data-cy="cookie-login"]').click()
    })

    it('works with no SameSite, no Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('AJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('AJohnson')
    })

    it('works with SameSite=None, Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="sameSite"]').select('None')
        cy.get('[data-cy="secure"]').check()
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('BJohnson')
    })

    it('works with SameSite=None, no Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="sameSite"]').select('None')
        cy.get('[data-cy="username"]').type('CJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('CJohnson')
    })

    it('works with SameSite=Lax, Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="sameSite"]').select('Lax')
        cy.get('[data-cy="secure"]').check()
        cy.get('[data-cy="username"]').type('DJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('DJohnson')
    })

    it('works with SameSite=Strict, Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="sameSite"]').select('Strict')
        cy.get('[data-cy="secure"]').check()
        cy.get('[data-cy="username"]').type('EJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('EJohnson')
    })

    it('works with invalid SameSite, Secure', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="sameSite"]').select('Invalid')
        cy.get('[data-cy="secure"]').check()
        cy.get('[data-cy="username"]').type('FJohnson')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn('FJohnson')
    })
  })
})
