import { launchStudio, loadProjectAndRunSpec, incrementCounter, inputNewTestName } from './helper'

describe('Cypress Studio - Navigation and URL Management', () => {
  it('does not re-enter studio mode when changing pages and then coming back', () => {
    launchStudio()
    // go to the runs page
    cy.findByTestId('sidebar-link-runs-page').click()

    // go back to the specs page
    cy.findByTestId('sidebar-link-specs-page').click()
    cy.contains('spec.cy.js').click()

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('handles back button in single test view', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('[data-cy="studio-back-button"]').click()

    cy.location().its('hash').should('not.contain', 'testId=').and('not.contain', 'studio=')

    cy.get('.runnable-title').eq(0).should('contain.text', 'studio functionality')
    cy.get('.runnable-title').eq(1).should('contain.text', 'visits a basic html page')
  })

  it('updates the AUT url when navigating to a different page', () => {
    launchStudio({ specName: 'navigation.cy.js' })

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/navigation.html')

    cy.getAutIframe().within(() => {
      cy.get('a').contains('Index').realClick()
    })

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/index.html')
  })

  it('updates the AUT url when creating a new test', () => {
    launchStudio({ specName: 'navigation.cy.js', createNewTestFromSuite: true })

    inputNewTestName({ creatingNewTestFromWelcomeScreen: false })

    cy.findByTestId('aut-url-input').should('have.focus').type('cypress/e2e/navigation.html{enter}')

    // after entering the url, the test is saved and re-run
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/navigation.html')
  })

  it('removes url parameters when going to a different page', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    // go to the runs page
    cy.findByTestId('sidebar-link-runs-page').click()

    cy.location().its('hash').should('contain', '/runs').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('updates the url with the testId and studio parameters when entering studio with a test', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('update the url with the suiteId and studio parameters when entering studio with a suite', () => {
    launchStudio({ createNewTestFromSuite: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('updates the studio url parameters and displays the single test view after creating a new test', () => {
    loadProjectAndRunSpec()

    // open the studio panel to create a new test in the root suite
    cy.findByTestId('studio-button').click()
    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'sessionId=')

    // create a new test in the root suite
    inputNewTestName()

    // the studio url parameters should be removed
    cy.location().its('hash').and('not.contain', 'suiteId=').and('contain', 'studio=').and('contain', 'testId=r2')

    cy.get('.studio-single-test-container').should('be.visible')

    cy.percySnapshot()
  })

  it('does not remove the studio url parameters when saving test changes', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')

    cy.findByTestId('record-button-recording').should('be.visible')

    cy.waitForSpecToFinish()

    cy.getAutIframe().within(() => {
      cy.get('#increment').realClick()
    })

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')
  })

  it('does not remove the studio url parameters if saving fails', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=').and('contain', 'sessionId=')

    // update the spec on the file system by changing the
    // test name which will cause the save to fail since
    // the test won't be found
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('CHANGED - visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.wait(200)

    cy.findByTestId('studio-save-button').click()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')
  })

  it('removes the studio url parameters when closing studio existing test with the back button', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.get('[data-cy="studio-back-button"]').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=')
  })

  it('removes the studio url parameters when closing studio existing test with the studio header button', () => {
    launchStudio()

    cy.location().its('hash').should('contain', 'testId=r3').and('contain', 'studio=')

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').and('not.contain', 'testId=').and('not.contain', 'studio=').and('not.contain', 'sessionId=')
  })

  it('does not prompt for a URL until studio is active', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })
    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')
    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url-input').should('have.value', 'http://localhost:4455/cypress/e2e/index.html')
  })

  it('does not reload the page if we didnt open a test in studio', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    // set a property on the window to see if the page reloads
    cy.window().then((w) => w['beforeReload'] = true)

    // close new test mode
    cy.findByTestId('studio-header-studio-button').click()

    // if this property is still set on the window, then the page didn't reload
    cy.window().then((w) => expect(w['beforeReload']).to.be.true)
  })

  it('removes the studio url parameters when closing studio new test', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=')

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').and('not.contain', 'suiteId=').and('not.contain', 'studio=')
  })
})
