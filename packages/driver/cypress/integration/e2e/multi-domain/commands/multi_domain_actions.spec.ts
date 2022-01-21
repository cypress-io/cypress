// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain actions', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
  })

  it('.type()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').type('foo')
      .should('have.value', 'foo')
    })
  })

  it('.focus()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').focus()
      .should('be.focused')
    })
  })

  it('.blur()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input').type('foo').blur()
      .should('not.be.focused')
    })
  })

  it('.clear()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#input')
      .type('foo').should('have.value', 'foo')
      .clear().should('have.value', '')
    })
  })

  it('.submit()', (done) => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', done, () => {
      Cypress.once('form:submitted', () => done())

      cy.get('#input-type-submit').submit()
    })
  })

  it('.click()', (done) => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', done, () => {
      cy.get('#button').then((btn) => {
        btn.on('click', () => done())
      }).click()
    })
  })

  it('.dblclick()', (done) => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', done, () => {
      cy.get('#button').then((btn) => {
        btn.on('dblclick', () => done())
      }).dblclick()
    })
  })

  it('.rightclick()', (done) => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', done, () => {
      cy.get('#button').then((btn) => {
        btn.on('contextmenu', () => done())
      }).rightclick()
    })
  })

  it('.check()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
    })
  })

  it('.uncheck()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]')
      .check().should('be.checked')
      .uncheck().should('not.be.checked')
    })
  })

  it('.select()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('select[name="foods"]')
      .select('Japanese').should('have.value', 'Japanese')
    })
  })

  it('.scrollIntoView()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#scroll-into-view-vertical h5')
      .should('not.be.visible')
      .scrollIntoView().should('be.visible')
    })
  })

  it('.scrollTo()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.switchToDomain('foobar.com', () => {
      cy.get('#scroll-into-view-vertical h5').should('not.be.visible')
      cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
      cy.get('#scroll-into-view-vertical h5').should('be.visible')
    })
  })

  it('.trigger()', (done) => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.switchToDomain('foobar.com', done, () => {
      cy.get('#button').then((btn) => {
        btn.on('click', () => done())
      }).trigger('click')
    })
  })
})
