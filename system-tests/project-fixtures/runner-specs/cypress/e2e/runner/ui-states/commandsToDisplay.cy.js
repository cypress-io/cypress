describe('Commands to display in UI', () => {
  it('part 1 - basic commands', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('.action-blur')
    .type('foo')
    .clear()

    cy.focused()
    .blur()

    cy.get('.action-check [type="checkbox"]').first()
    .check()
    .uncheck()

    cy.get('div')
    .children()

    cy.setCookie('fakeCookie', '123ABC')
    cy.getCookie('fakeCookie')
    cy.getCookies()
    cy.clearCookie('fakeCookie')
    cy.clearCookies()

    cy.clearLocalStorage()

    cy.get('.action-btn')
    .click()
    .dblclick()
    .rightclick()

    const now = new Date(Date.UTC(2017, 2, 14)).getTime()

    cy.clock(now)
    cy.tick(10000)
  })

  it('part 2 - traversal and navigation', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('li').closest('.nav')

    cy.contains('Commands')
    cy.get('li').contains('Commands')

    cy.document()

    cy.get('div').eq(0)

    cy.exec('echo Jane Lane')

    cy.get('div')
    .filter('.container')
    .find('#navbar')
    .first()

    cy.go('forward')

    cy.hash()
  })

  it('part 3 - element manipulation', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('div').invoke('text')

    cy.get('div').its('length')

    cy.get('div').last()

    cy.location()

    cy.log('message')

    cy.get('div')
    .next()
    .nextAll()
    .not('.container')
    .parent()
    .parents()
    .parentsUntil()
    .prev()
    .prevAll()
    .prevUntil()
  })

  it('part 4 - advanced interactions', () => {
    cy.visit('cypress/fixtures/commandsActions.html')

    cy.get('div').first()
    .scrollIntoView()
    .screenshot()

    cy.scrollTo('bottom')

    cy.get('.action-select')
    .select('apples')
    .siblings()

    cy.get('form').first()

    cy.title()

    cy.get('div').first().trigger('click')

    cy.url()

    cy.viewport('ipad-2')

    cy.wait(2)

    cy.window()

    cy.get('div').first().within(() => {

    })

    cy.wrap({ foo: 'bar' })

    cy.session('session', () => {
      cy.visit('cypress/fixtures/uiStates.html')
    })
  })
})
