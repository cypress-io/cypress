import { launchStudio, incrementCounter } from './helper'

describe('Cypress Studio - State Management', () => {
  it('exits studio mode if the spec is removed on the file system', () => {
    launchStudio()

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    // update the spec on the file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress/e2e/spec.cy.js')
    })

    cy.location().its('hash').should('equal', '#/specs').and('not.contain', 'testId=').and('not.contain', 'studio=')
    cy.findByTestId('alert').should('contain.text', 'Spec not found')

    if (Cypress.platform === 'win32') {
      cy.findByTestId('alert-body').should('contain.text', 'There is no spec matching the following location: cypress\\e2e\\spec.cy.js')
    } else {
      cy.findByTestId('alert-body').should('contain.text', 'There is no spec matching the following location: cypress/e2e/spec.cy.js')
    }
  })

  it('writes the studio commands to the test block when the spec is updated on the file system and file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    // update the spec on the file system
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `describe('studio functionality', () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')

    // new command
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
})`)
    })

    cy.findByTestId('studio-save-button').click()

    cy.waitForSpecToFinish()

    // only the commands in the editor are written to the test block - ideally we should also pick up the changes from the file system
    // TODO: https://github.com/cypress-io/cypress-services/issues/11085
    cy.get('.command-name-visit').within(() => {
      cy.contains('visit')
      cy.contains('cypress/e2e/index.html')
    })

    cy.get('.command-name-get').first().within(() => {
      cy.contains('get')
      cy.contains('#increment')
    })

    cy.get('.command-name-click').within(() => {
      cy.contains('click')
    })
  })

  it('remains in studio mode when the test name is changed on the file system and file watching is disabled', () => {
    launchStudio({ cliArgs: ['--config', 'watchForFileChanges=false'] })

    // since we aren't logged in, we need to close the connect to cloud panel
    cy.get('[data-cy="studio-error"]').within(() => {
      cy.contains('Connect to Cypress Cloud').should('be.visible')
      cy.get('[aria-label="Close"]').click()
    })

    cy.findByTestId('record-button-recording').should('be.visible')

    incrementCounter(0)

    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

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

    // the commands should still be there since the save failed
    cy.get('.cm-line').should('contain.text', `cy.get('#increment').click();`)

    cy.findByTestId('studio-error').should('contain.text', 'Failed to save test code')
  })

  it('does not exit studio mode if the spec is changed on the file system', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    // update the spec on the file system to force a rerun through watched:file:changed
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.writeFileInProject('cypress/e2e/spec.cy.js', `
describe('studio functionality', () => {
  it('visits a basic html page', () => {
    // new comment
    cy.visit('cypress/e2e/index.html')
  })
})`)
    })

    cy.waitForSpecToFinish()

    // verify studio is still open
    cy.findByTestId('studio-panel').should('be.visible')
  })

  it('persists sessionId across page refresh', () => {
    launchStudio()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.location().its('hash').should('contain', 'sessionId=')

    let originalSessionId: string

    cy.location('hash').then((hash) => {
      const urlParams = new URLSearchParams(hash)

      originalSessionId = urlParams.get('sessionId')!

      expect(originalSessionId).to.be.a('string')
      expect(originalSessionId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    cy.reload()

    cy.waitForSpecToFinish()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.location().its('hash').should('contain', 'sessionId=')

    cy.location('hash').then((hash) => {
      const urlParams = new URLSearchParams(hash)
      const persistedSessionId = urlParams.get('sessionId')

      expect(persistedSessionId).to.equal(originalSessionId)
    })

    cy.findByTestId('studio-header-studio-button').click()

    cy.location().its('hash').should('not.contain', 'sessionId=')

    cy.findByTestId('studio-panel').should('not.exist')
  })
})
