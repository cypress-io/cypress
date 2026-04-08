import { launchStudio, loadProjectAndRunSpec, incrementCounter, inputNewTestName, openNewTestFromSpecHeader } from './helper'

describe('Cypress Studio - New Test Creation', () => {
  it('does not enter single test mode when creating a new test', () => {
    launchStudio({ specName: 'spec-w-multiple-tests.cy.js', createNewTestFromSuite: true })

    // verify we are not in single test mode
    cy.get('.runnable-title').should('have.length', 4)
    cy.get('.runnable-title').its(0).should('have.text', 'studio functionality')
    cy.get('.runnable-title').its(1).should('contain.text', 'visits a basic html page')
    cy.get('.runnable-title').its(2).should('contain.text', 'visits a basic html page 2')
    cy.get('.runnable-title').its(3).should('contain.text', 'visits a basic html page 3')
  })

  describe('from spec header', () => {
    const assertRootCreatedTest = () => {
      // we should have the commands we executed after we save
      cy.withCtx(async (ctx) => {
        const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-visit.cy.js')

        expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/index.html')
  })

  it('visits a basic html page', () => {
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })
});

it('new-test', function() {
  cy.visit("cypress/e2e/index.html")
});`.trim())
      })
    }

    const saveNewTest = () => {
      inputNewTestName()

      cy.contains('new-test').click()

      cy.percySnapshot()

      cy.get('.cm-content').invoke('text', 'cy.visit("cypress/e2e/index.html")')

      cy.findByTestId('studio-save-button').click()

      // verify recording is enabled to ensure the panel is fully ready
      cy.findByTestId('record-button-recording').should('have.text', 'Recording...')
    }

    it('outside of studio', () => {
      loadProjectAndRunSpec({ specName: 'spec-w-visit.cy.js' })
      openNewTestFromSpecHeader()

      saveNewTest()

      assertRootCreatedTest()
    })

    it('in studio welcome screen', () => {
      launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSpecHeader: true })

      saveNewTest()

      assertRootCreatedTest()
    })

    it('in studio single test mode', () => {
      launchStudio({ specName: 'spec-w-visit.cy.js' })

      openNewTestFromSpecHeader()

      saveNewTest()

      // we should have the commands we executed after we save
      cy.withCtx(async (ctx) => {
        const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-visit.cy.js')

        return spec.trim().replace(/\r/g, '')
      }).then((normalizedSpec) => {
        expect(normalizedSpec).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/index.html')
  });

  it('visits a basic html page', () => {
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })

  it('new-test', function() {
    cy.visit("cypress/e2e/index.html")
  });
})
`.trim())
      })
    })
  })

  // TODO: this test fails in CI but passes locally
  // http://github.com/cypress-io/cypress/issues/31248
  it.skip('creates a new test with a url that changes top', function () {
    launchStudio({ specName: 'spec-w-foobar.cy.js', createNewTestFromSuite: true })

    cy.origin('http://foobar.com:4455', () => {
      Cypress.require('../support/execute-spec')
      Cypress.require('cypress-real-events/support')
      Cypress.require('@packages/frontend-shared/cypress/support/e2e')
    })

    cy.findByTestId('aut-url').as('urlPrompt')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').should('be.disabled')
    })

    // go to a cross-origin url
    cy.get('@urlPrompt').type('http://foobar.com:4455/cypress/e2e/index.html')

    cy.get('@urlPrompt').within(() => {
      cy.contains('Continue ➜').click()
    })

    cy.origin('http://foobar.com:4455', () => {
      cy.get('button').contains('Save Commands').click()

      // the save button is disabled until we add a test name
      cy.get('button[type=submit]').should('be.disabled')

      cy.get('#testName').type('new-test')

      cy.get('button[type=submit]').click()

      // Cypress re-runs after the new test is saved.
      cy.waitForSpecToFinish({ passCount: 2 })

      cy.contains('new-test').click()
      cy.get('.command').should('have.length', 1)
      cy.get('.command-name-visit').within(() => {
        cy.contains('visit')
        cy.contains('cypress/e2e/index.html')
      })

      cy.findByTestId('hook-name-studio commands').should('not.exist')
    })

    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-foobar.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://foobar.com:4455/cypress/e2e/index.html', {
      statusCode: 200,
      body: '<html><body><h1>hello world</h1></body></html>',
      headers: {
        'content-type': 'text/html',
      },
    })
  })

  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })

  /* ==== Test Created with Cypress Studio ==== */
  it('new-test', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('http://foobar.com:4455/cypress/e2e/index.html');
    /* ==== End Cypress Studio ==== */
  });
})`.trim())
    })
  })

  it('creates a new test for a specific suite with the url already defined', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    inputNewTestName()

    // make sure that the visit has run and we're recording studio commands
    cy.get('[data-cy="record-button-recording"]').should('be.visible')

    cy.percySnapshot()

    incrementCounter(0)

    cy.findByTestId('studio-save-button').click()

    // we should have the commands we executed after we save
    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/spec-w-visit.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
describe('studio functionality', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/index.html')
  });

  it('visits a basic html page', () => {
    cy.get('h1').should('have.text', 'Hello, Studio!')
  })

  it('new-test', function() {
    cy.get('#increment').click();
  });
})`.trim())
    })
  })

  it('creates a new test from an empty spec', () => {
    loadProjectAndRunSpec({ specName: 'empty.cy.js', specSelector: 'title' })

    cy.contains('Create test with Cypress Studio').click()

    inputNewTestName()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish()

    cy.get('.cm-content').invoke('text', 'cy.visit("cypress/e2e/index.html")')

    cy.findByTestId('studio-save-button').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

    // we should have the commands we executed after we save
    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/empty.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
it('new-test', function() {
    cy.visit("cypress/e2e/index.html")
});`.trim())
    })
  })

  it('opens the name test screen from the welcome screen and creates a new test from an empty spec', () => {
    loadProjectAndRunSpec({ specName: 'empty.cy.js', specSelector: 'title' })

    cy.findByTestId('studio-button').click()

    cy.get('[data-cy="studio-panel"]').should('be.visible')

    cy.contains('Create test with Cypress Studio').click()

    inputNewTestName()

    // Cypress re-runs after the new test is saved.
    cy.waitForSpecToFinish()

    cy.get('.cm-content').invoke('text', 'cy.visit("cypress/e2e/index.html")')

    cy.findByTestId('studio-save-button').click()

    // verify recording is enabled to ensure the panel is fully ready
    cy.findByTestId('record-button-recording').should('have.text', 'Recording...')

    // we should have the commands we executed after we save
    cy.withCtx(async (ctx) => {
      const spec = await ctx.actions.file.readFileInProject('cypress/e2e/empty.cy.js')

      expect(spec.trim().replace(/\r/g, '')).to.equal(`
it('new-test', function() {
    cy.visit("cypress/e2e/index.html")
});`.trim())
    })
  })

  it('allows .only tests to be edited in studio', () => {
    loadProjectAndRunSpec({ specName: 'spec-with-only.cy.js' })

    // verify the test is the only one that runs
    cy.get('.test').should('have.length', 1)
    cy.get('.test').contains('should be the only test to run normally').should('be.visible')

    // open edit in studio
    cy.contains('should be the only test to run normally')
    .closest('.runnable-wrapper')
    .findByTestId('launch-studio')
    .click()

    cy.findByTestId('studio-panel').should('be.visible')

    cy.findByTestId('studio-single-test-title').should('have.text', 'should be the only test to run normally')
  })

  it('creates and runs new tests in studio mode when there is a .only test in the spec file', () => {
    loadProjectAndRunSpec({ specName: 'spec-with-only.cy.js' })

    cy.get('.test').should('have.length', 1)
    cy.get('.test').contains('should be the only test to run normally').should('be.visible')
    // create a new test from the spec header
    openNewTestFromSpecHeader()

    cy.findByTestId('studio-panel').should('be.visible').within(() => {
      cy.get('[data-cy="test-name-input"]').type('new test{enter}')
    })

    cy.get('.spec-name').should('have.text', 'spec-with-only')
    // our new test runs in studio mode even though it doesn't have a .only
    cy.get('[data-cy="studio-single-test-title"]').should('have.text', 'new test')
  })

  it('continues to display the welcome screen after reloading', () => {
    loadProjectAndRunSpec({ specName: 'spec-w-visit.cy.js' })

    // open welcome screen
    cy.findByTestId('studio-button').click()

    cy.findByTestId('new-test-features').should('be.visible')
    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'entrySource=welcome')

    cy.reload()

    cy.findByTestId('new-test-features').should('be.visible')
    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'entrySource=welcome')
  })

  it('continues to display the name test screen after reloading the page for a new test from root suite', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSpecHeader: true })

    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'entrySource=new-test-root')

    cy.get('[data-cy="name-test-container"]').should('be.visible')

    cy.reload()

    cy.location().its('hash').should('contain', 'suiteId=r1').and('contain', 'studio=').and('contain', 'entrySource=new-test-root')

    cy.get('[data-cy="name-test-container"]').should('be.visible')
  })

  it('continues to display the name test screen after reloading the page for a new test from suite', () => {
    launchStudio({ specName: 'spec-w-visit.cy.js', createNewTestFromSuite: true })

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=').and('contain', 'entrySource=new-test-suite')

    cy.get('[data-cy="name-test-container"]').should('be.visible')

    cy.reload()

    cy.location().its('hash').should('contain', 'suiteId=r2').and('contain', 'studio=').and('contain', 'entrySource=new-test-suite')

    cy.get('[data-cy="name-test-container"]').should('be.visible')
  })

  describe('prompt for a new url', () => {
    const autUrl = 'http://localhost:4455/cypress/e2e/index.html'
    const visitUrl = 'cypress/e2e/index.html'

    const clearUrl = () => {
      cy.findByTestId('aut-url-input').should('have.value', autUrl)

      cy.get('.cm-content').invoke('text', '')

      cy.findByTestId('studio-save-button').click()

      cy.findByTestId('aut-url-input').should('have.value', '')

      cy.findByTestId('aut-url-input').should('have.focus')

      cy.findByTestId('studio-error-visit-url-banner').should('exist')
    }

    const assertAutUrlInput = () => {
      cy.findByTestId('aut-url-input').should('have.value', autUrl)

      cy.findByTestId('studio-error-visit-url-banner').should('not.exist')

      cy.get('.cm-line').should('contain.text', `cy.visit('${visitUrl}')`)
    }

    const clearAndAddAutUrl = () => {
      clearUrl()
      cy.findByTestId('aut-url-input').type(`${visitUrl}{enter}`)
      assertAutUrlInput()
    }

    const clearAndAddTestBlockEditorUrl = () => {
      clearUrl()
      cy.get('.cm-content').invoke('text', 'cy.visit(\'cypress/e2e/index.html\')')
      cy.findByTestId('studio-save-button').click()
      assertAutUrlInput()
    }

    beforeEach(() => {
      launchStudio()
    })

    it('when an existing visit command is cleared and adds a new url via the aut url input', () => {
      clearAndAddAutUrl()
    })

    it('when an existing visit command is cleared and adds a new url via test block editor', () => {
      clearAndAddTestBlockEditorUrl()
    })

    it('ensures we clear the aut url input properly in between adding and clearing urls', () => {
      clearAndAddAutUrl()
      clearAndAddTestBlockEditorUrl()
    })
  })
})
