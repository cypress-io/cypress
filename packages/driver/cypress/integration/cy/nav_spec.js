describe('chrome extra load event', () => {
  it('cy.back & cy.forward', () => {
    const navEvents = []

    cy.on('navigation:changed', (e) => {
      navEvents.push(e)
    })

    cy.visit('/fixtures/generic.html')

    cy.get('#hashchange').click()
    cy.wait(2000)

    cy.go('back')

    cy.wait(2000)

    cy.go('forward')

    cy.wait(2000)

    cy.get('#dimensions').click()

    cy.wait(2000)
    cy.go('back')

    cy.wait(2000)
    cy.go('back')

    cy.wrap(navEvents)
    .should('deep.equal', [
      'page navigation event (load)', // load about:blank
      'page navigation event (before:load)', // before:load generic html
      'page navigation event (load)', // load generic.html
      'hashchange', // click generic.html#hashchange
      'hashchange', // back generic.html
      'hashchange', // forward generic.html#hashchange
      'page navigation event (before:load)', // before:load dimensions.html
      'page navigation event (load)', // load dimensions.html
      'page navigation event (before:load)', // before:load generic.html#hashchange
      'page navigation event (load)', // load generic.html#hashchange
      'hashchange', // forward generic.html
    ])
  })

  it('extra load events on hashchange', () => {
    const navEvents = []

    cy.on('navigation:changed', (e) => {
      navEvents.push(e)
    })

    cy.visit('/fixtures/generic.html')

    cy.get('#hashchange').click()
    .window()
    .then((win) => {
      win.history.back()
    })

    cy.wait(2000)

    cy.window().then((win) => {
      win.history.forward()
    })

    cy.wait(2000)

    cy.get('#dimensions').click()

    cy.wait(2000)

    cy.window()
    .then((win) => {
      win.history.back()
    })

    cy.wait(2000)
    cy.window()
    .then((win) => {
      win.history.back()
    })

    cy.wait(2000)

    cy.wrap(navEvents)
    .should('deep.equal', [
      'page navigation event (load)', // load about:blank
      'page navigation event (before:load)', // before:load generic html
      'page navigation event (load)', // load generic.html
      'hashchange', // click generic.html#hashchange
      'hashchange', // back generic.html
      'hashchange', // forward generic.html#hashchange
      'page navigation event (before:load)', // before:load dimensions.html
      'page navigation event (load)', // load dimensions.html
      'page navigation event (before:load)', // before:load generic.html#hashchange
      'page navigation event (load)', // load generic.html#hashchange
      'hashchange', // forward generic.html
    ])
  })

  it('extra load events on history.go', () => {
    const navEvents = []

    cy.on('navigation:changed', (e) => {
      navEvents.push(e)
    })

    cy.visit('/fixtures/generic.html')

    cy.get('#hashchange').click()
    .window()
    .then((win) => {
      win.history.go(-1)
    })

    cy.wait(2000)

    cy.window().then((win) => {
      win.history.go(1)
    })

    cy.wait(2000)

    cy.get('#dimensions').click()

    cy.wait(2000)
    cy.window()
    .then((win) => {
      win.history.back(-1)
    })

    cy.wait(2000)
    cy.window()
    .then((win) => {
      win.history.back(-1)
    })

    cy.wrap(navEvents)
    .should('deep.equal', [
      'page navigation event (load)', // load about:blank
      'page navigation event (before:load)', // before:load generic html
      'page navigation event (load)', // load generic.html
      'hashchange', // click generic.html#hashchange
      'hashchange', // back generic.html
      'hashchange', // forward generic.html#hashchange
      'page navigation event (before:load)', // before:load dimensions.html
      'page navigation event (load)', // load dimensions.html
      'page navigation event (before:load)', // before:load generic.html#hashchange
      'page navigation event (load)', // load generic.html#hashchange
      'hashchange', // forward generic.html
    ])
  })
})
