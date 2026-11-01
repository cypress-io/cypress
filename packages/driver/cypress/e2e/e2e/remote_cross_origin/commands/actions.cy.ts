describe('remote driver: actions in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
  })

  it('.type()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#input').type('foo')
    .should('have.value', 'foo')
  })

  it('.focus()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#input').focus()
    .should('be.focused')
  })

  it('.blur()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#input').type('foo').blur()
    .should('not.be.focused')
  })

  it('.clear()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#input')
    .type('foo').should('have.value', 'foo')
    .clear().should('have.value', '')
  })

  // inline handlers stand in for listeners, since the spec can't attach any to the AUT's elements
  it('.submit()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#input-type-submit').invoke('attr', 'onsubmit', 'this.dataset.submitted = "true"; return false')
    cy.get('#input-type-submit').submit()
    cy.get('#input-type-submit').should('have.attr', 'data-submitted', 'true')
  })

  it('.click()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#button').invoke('attr', 'onclick', 'this.textContent = "clicked"')
    cy.get('#button').click()
    cy.get('#button').should('have.text', 'clicked')
  })

  it('.dblclick()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#button').invoke('attr', 'ondblclick', 'this.textContent = "dblclicked"')
    cy.get('#button').dblclick()
    cy.get('#button').should('have.text', 'dblclicked')
  })

  it('.rightclick()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#button').invoke('attr', 'oncontextmenu', 'this.textContent = "rightclicked"')
    cy.get('#button').rightclick()
    cy.get('#button').should('have.text', 'rightclicked')
  })

  it('.check()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get(':checkbox[name="colors"][value="blue"]')
    .check().should('be.checked')
  })

  it('.uncheck()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get(':checkbox[name="colors"][value="blue"]')
    .check().should('be.checked')
    .uncheck().should('not.be.checked')
  })

  it('.select()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('select[name="foods"]')
    .select('Japanese').should('have.value', 'Japanese')
  })

  it('.scrollIntoView()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.get('#scroll-into-view-vertical').its('0.scrollTop').should('eq', 0)
    cy.get('#scroll-into-view-vertical h5').scrollIntoView().should('be.visible')
    cy.get('#scroll-into-view-vertical').its('0.scrollTop').should('be.greaterThan', 0)
  })

  it('.scrollTo()', () => {
    cy.get('a[data-cy="scrolling-link"]').click()

    cy.get('#scroll-into-view-vertical').its('0.scrollTop').should('eq', 0)
    cy.get('#scroll-into-view-vertical').scrollTo(0, 300)
    cy.get('#scroll-into-view-vertical').its('0.scrollTop').should('eq', 300)
    cy.get('#scroll-into-view-vertical h5').should('be.visible')
  })

  it('.trigger()', () => {
    cy.get('a[data-cy="dom-link"]').click()

    cy.get('#button').invoke('attr', 'onclick', 'this.textContent = "triggered"')
    cy.get('#button').trigger('click')
    cy.get('#button').should('have.text', 'triggered')
  })

  it('.selectFile()', () => {
    cy.get('a[data-cy="files-form-link"]').click()

    cy.wrap(Cypress.Buffer.from('foo')).as('foo')

    cy.get('#basic').selectFile({ contents: '@foo', fileName: 'foo.txt' })
    cy.get('#basic').its('0.files.0.name').should('eq', 'foo.txt')
    cy.get('#basic').its('0.files.0.size').should('eq', 3)
  })

  context('commands that read or navigate the AUT', () => {
    beforeEach(() => {
      cy.get('a[data-cy="dom-link"]').click()
    })

    // Firefox restores typed form values on reload, so the page marks itself instead
    it('.reload()', () => {
      cy.get('body').invoke('attr', 'data-before-reload', 'true')
      cy.reload()
      cy.get('body').should('not.have.attr', 'data-before-reload')
    })

    it('.url()', () => {
      cy.url().should('eq', 'http://www.foobar.com:3500/fixtures/dom.html')
    })

    it('.hash()', () => {
      cy.hash().should('eq', '')
    })

    it('.location()', () => {
      cy.location('href').should('eq', 'http://www.foobar.com:3500/fixtures/dom.html')
    })

    it('.title()', () => {
      cy.title().should('eq', 'DOM Fixture')
    })

    it('.go()', () => {
      cy.go('back')
      cy.url().should('contain', '/fixtures/primary-origin.html')
    })

    it('.document()', () => {
      cy.document().its('title').should('eq', 'DOM Fixture')
    })

    it('.scrollTo() the window', () => {
      cy.scrollTo('bottom')
      cy.document().its('scrollingElement.scrollTop').should('be.greaterThan', 0)
    })
  })
})
