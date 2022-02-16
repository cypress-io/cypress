import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

describe('Cypress In Cypress', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp()
  })

  it('test e2e', () => {
    cy.contains('dom-content.spec').click()
    cy.location().should((location) => {
      expect(location.hash).to.contain('dom-content.spec')
    })

    let styleBuffer = ''

    cy.get('link[rel=stylesheet]').each(($el) => {
      cy.request(`http://localhost:4455${ $el.attr('href')}`)
      .then((res) => {
        styleBuffer += `
        ${res.body}`
      })
    })
    .then(() => {
      (document.querySelector('body') as HTMLElement).innerHTML += `<style id="percy-test">${styleBuffer}</style>`
    })

    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('be.visible')
    cy.findByTestId('select-browser').click()

    cy.contains('Firefox').click()

    cy.percySnapshot('browsers open')

    cy.contains('Chrome 1')
    .focus()
    .type('{esc}')

    cy.contains('Firefox').should('be.hidden')

    cy.findByTestId('viewport').click()
    cy.contains('The viewport determines the width and height of your application. By default the viewport will be 1000px by 660px for End-to-end Testing unless specified by a cy.viewport command.')
    .should('be.visible')

    cy.percySnapshot('viewport info open')

    cy.get('body').click()

    cy.findByTestId('playground-activator').click()
    cy.findByTestId('playground-selector').clear().type('li')

    cy.percySnapshot('cy.get selector')

    cy.findByTestId('playground-num-elements').contains('3 Matches')

    cy.findByLabelText('Selector Methods').click()
    cy.findByRole('menuitem', { name: 'cy.contains' }).click()

    cy.findByTestId('playground-selector').clear().type('Item 1')

    cy.percySnapshot('cy.contains selector')

    cy.findByTestId('playground-num-elements').contains('1 Match')

    cy.window().then((win) => cy.spy(win.console, 'log'))
    cy.findByTestId('playground-print').click().window().then((win) => {
      expect(win.console.log).to.have.been.calledWith('%cCommand:  ', 'font-weight: bold', 'cy.contains(\'Item 1\')')
    })
  })

  it('navigation between specs and other parts of the app works', () => {
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    let styleBuffer = ''

    cy.get('link[rel=stylesheet]').each(($el) => {
      cy.request(`http://localhost:4455${ $el.attr('href')}`)
      .then((res) => {
        styleBuffer += `
        ${res.body}`
      })
    })
    .then(() => {
      (document.querySelector('body') as HTMLElement).innerHTML += `<style id="percy-test">${styleBuffer}</style>`
    })

    // go to Settings page and back to spec runner
    cy.contains('a', 'Settings').click()
    cy.contains(defaultMessages.settingsPage.device.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')

    // go to Runs page and back to spec runner
    cy.contains('a', 'Runs').click()
    cy.contains(defaultMessages.runs.connect.title).should('be.visible')
    cy.contains('a', 'Specs').click()
    cy.contains('dom-content.spec').click()
    cy.get('[data-model-state="passed"]').should('contain', 'renders the test content')
  })
})
