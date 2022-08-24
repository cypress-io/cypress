describe('creates global session', () => {
  it('creates global sessions', () => {
    cy.then(async () => {
      await Cypress.session.clearAllSavedSessions()
    })

    cy.login('global_1', true)

    if (Cypress.env('SYSTEM_TESTS')) {
      cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
      })
    }

    cy.visit('/cypress/fixtures/home.html')
    cy.getCookie('token').then((cookie) => {
      expect(cookie.value).to.eq('1')
    })
  })

  it.only('restores global session', async () => {
    console.log('test two')
    cy.task('does_not_exist')
    cy.session('global_1', () => {})
    cy.login('global_1', true)

    if (Cypress.env('SYSTEM_TESTS')) {
      cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('restored')
      })
    }

    cy.visit('/cypress/fixtures/home.html')
    cy.getCookie('token').then((cookie) => {
      expect(cookie.value).to.eq('1')
    })
  })

  it('creates spec session', () => {
    cy.login('spec_session', false)

    if (Cypress.env('SYSTEM_TESTS')) {
      cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('created')
      })
    }

    cy.visit('/cypress/fixtures/home.html')
    cy.getCookie('token').then((cookie) => {
      expect(cookie.value).to.eq('2')
    })
  })

  it('restores spec session', () => {
    cy.login('spec_session', false)

    if (Cypress.env('SYSTEM_TESTS')) {
      cy.wrap(null).should(() => {
        expect(cy.$$('.commands-container li.command:first', top.document).text()).contain('restored')
      })
    }

    cy.visit('/cypress/fixtures/home.html')
    cy.getCookie('token').then((cookie) => {
      expect(cookie.value).to.eq('2')
    })
  })
})
