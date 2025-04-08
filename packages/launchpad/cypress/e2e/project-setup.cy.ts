import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { getPathForPlatform } from './support/getPathForPlatform'

function verifyScaffoldedFiles (testingType: string) {
  const expectedFileOrder = (testingType === 'e2e') ? [
    'cypress.config.',
    'support/e2e.',
    'support/commands.',
    'fixtures/example.',
  ] : [
    'cypress.config.',
    'support/component.',
    'support/commands.',
    'support/component-index.',
    'fixtures/example.',
  ]

  cy.get('[data-cy="collapsible-header"] h2')
  .should(($elements) => expect($elements).to.have.length(expectedFileOrder.length)) // assert number of files
  .each(($el, i) => {
    const relativePath = $el.text()

    expect(relativePath, `file index ${i}`).to.include(getPathForPlatform(expectedFileOrder[i])) // assert file order

    cy.withCtx(async (ctx, o) => { // assert file exists
      const stats = await ctx.file.checkIfFileExists(o.relativePath)

      expect(stats).to.not.be.null.and.not.be.undefined
    }, { relativePath })
  })
}

describe('Launchpad: Setup Project', () => {
  function scaffoldAndOpenProject (name: Parameters<typeof cy.scaffoldProject>[0], args?: Parameters<typeof cy.openProject>[1]) {
    cy.scaffoldProject(name)
    cy.openProject(name, args)

    cy.withCtx(async (ctx, o) => {
      o.sinon.stub(ctx.project, 'projectId').resolves(null)
      o.sinon.stub(ctx._apis.localSettingsApi, 'getPreferences').resolves({ majorVersionWelcomeDismissed: {
        [o.MAJOR_VERSION_FOR_CONTENT]: Date.now(),
      } })

      // Delete the fixtures folder so it scaffold correctly the example
      await ctx.actions.file.removeFileInProject('cypress/fixtures')
    }, {
      MAJOR_VERSION_FOR_CONTENT: GET_MAJOR_VERSION_FOR_CONTENT(),
    })
  }

  const verifyWelcomePage = ({ e2eIsConfigured, ctIsConfigured }) => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('[data-cy-testingtype="e2e"]', 'Not Configured')
    .should(e2eIsConfigured ? 'not.exist' : 'exist')

    cy.contains('[data-cy-testingtype="component"]', 'Not Configured')
    .should(ctIsConfigured ? 'not.exist' : 'exist')
  }

  const verifyChooseABrowserPage = () => {
    cy.contains('Choose a browser', { timeout: 15000 })

    cy.findByRole('radio', { name: 'Chrome v1' })
    cy.findByRole('radio', { name: 'Firefox v6' })
    cy.findByRole('radio', { name: 'Electron v13' })
    cy.findByRole('radio', { name: 'Edge v9' })
  }

  beforeEach(() => {
    cy.findBrowsers({
      filter: (browser) => {
        return Cypress._.includes(['chrome', 'firefox', 'electron', 'edge'], browser.name) && browser.channel === 'stable'
      },
    })
  })

  it('no initial setup displays welcome page', () => {
    scaffoldAndOpenProject('pristine')
    cy.visitLaunchpad()
    cy.contains('Welcome to Cypress!').should('be.visible')
    verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
  })

  it('opens correctly in unconfigured project with --e2e', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine', ['--e2e'])
    cy.visitLaunchpad()

    cy.contains('h1', 'Configuration files')
    cy.findByText('We added the following files to your project:')

    cy.get('[data-cy=valid]').as('valid').contains('cypress.config.js')
    cy.get('@valid').containsPath('cypress/support/e2e.js')
    cy.get('@valid').containsPath('cypress/support/commands.js')
    cy.get('@valid').containsPath('cypress/fixtures/example.json')

    cy.get('[data-cy=valid] [data-cy=collapsible-header]').each((element) => {
      cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
    })

    verifyScaffoldedFiles('e2e')
  })

  it('opens correctly in unconfigured project with --component', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine', ['--component'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Project setup')
  })

  describe('"learn about testing types" modal', () => {
    beforeEach(() => {
      scaffoldAndOpenProject('pristine')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
    })

    it('welcome page has "learn about testing types" link which opens modal', () => {
      cy.contains('Review the differences').click()

      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' }).should('be.visible')
      cy.contains('Need help').should('be.visible')

      cy.get('[data-cy="end-to-end-comparison"]').within(() => {
        cy.contains('End-to-end tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })

      cy.get('[data-cy="component-comparison"]').within(() => {
        cy.contains('Component tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })
    })

    it('close modal with escape key', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' })
      .as('aboutTestingTypes')
      .should('be.visible')

      cy.get('body').type('{esc}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by clicking outside of modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' })
      .as('aboutTestingTypes')
      .should('be.visible')

      cy.get('body').click(5, 5)
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by clicking close button', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key differences').should('be.visible')
      })

      cy.findByRole('button', { name: 'Close' }).click()
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key differences').should('be.visible')

        cy.findByRole('button', { name: 'Close' })
        .focus()
        .type('{enter}')
      })

      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('clicking "Need Help?" links to Cypress documentation', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key differences' })
      .should('be.visible')
      .within(() => {
        cy.validateExternalLink({
          name: 'Need help',
          href: 'https://on.cypress.io/choosing-testing-type',
        })
      })
    })
  })

  describe('E2E test setup', () => {
    describe('project has been configured for e2e', () => {
      it('skips the setup page when choosing e2e tests to run', () => {
        scaffoldAndOpenProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="e2e"]').click()

        verifyChooseABrowserPage()
      })

      it('opens to the browser pages when opened via cli with --e2e flag', () => {
        scaffoldAndOpenProject('pristine-with-e2e-testing', ['--e2e'])
        cy.visitLaunchpad()

        verifyChooseABrowserPage()
      })
    })

    // project has a cypress.configuration file with component testing configured
    describe('project that has not been configured for e2e', () => {
      it('shows the configuration setup page when selecting e2e tests', () => {
        scaffoldAndOpenProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').as('valid').contains('cypress.config.js')
        cy.get('@valid').containsPath('cypress/support/e2e.js')
        cy.get('@valid').containsPath('cypress/support/commands.js')
        cy.get('@valid').containsPath('cypress/fixtures/example.json')

        cy.get('[data-cy=valid] [data-cy=collapsible-header]').each((element) => {
          cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.be.disabled')
        .click()
      })

      it('moves to "Choose a browser" page after clicking "Continue" button in first step in configuration page', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').as('valid').contains('cypress.config.js')
        cy.get('@valid').containsPath('cypress/support/e2e.js')
        cy.get('@valid').containsPath('cypress/support/commands.js')
        cy.get('@valid').containsPath('cypress/fixtures/example.json')

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.be.disabled')
        .click()

        verifyChooseABrowserPage()
      })

      it('shows the configuration setup page when opened via cli with --component flag', () => {
        scaffoldAndOpenProject('pristine-with-ct-testing', ['--component'])
        cy.visitLaunchpad()
        verifyChooseABrowserPage()
      })
    })

    describe('project not been configured for cypress', () => {
      it('can setup e2e testing for a project selecting JS', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.tabUntil((el) => el.text().includes('E2E Testing'))

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Configuration files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').as('valid').contains('cypress.config.js')
        cy.get('@valid').containsPath('cypress/support/e2e.js')
        cy.get('@valid').containsPath('cypress/support/commands.js')
        cy.get('@valid').containsPath('cypress/fixtures/example.json')

        cy.get('[data-cy=valid] [data-cy=collapsible-header]').each((element) => {
          cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.be.disabled')
        .click()

        verifyChooseABrowserPage()
      })

      it('can setup e2e testing for a project selecting TS', () => {
        // has `typescript` in `package.json`
        scaffoldAndOpenProject('pristine-yarn')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.tabUntil((el) => el.text().includes('E2E Testing'))

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Configuration files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').as('valid').contains('cypress.config.ts')
        cy.get('@valid').containsPath('cypress/support/e2e.ts')
        cy.get('@valid').containsPath('cypress/support/commands.ts')
        cy.get('@valid').containsPath('cypress/fixtures/example.json')

        cy.get('[data-cy=valid] [data-cy=collapsible-header]').each((element) => {
          cy.wrap(element).should('have.attr', 'aria-expanded', 'false')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.be.disabled')
        .click()

        verifyChooseABrowserPage()
      })

      it('can skip setup CT testing for an E2E project', () => {
        scaffoldAndOpenProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'React.js' }).click()

        cy.contains('Pick a bundler').click()
        cy.findByRole('option', { name: 'Vite' }).click()

        cy.findByRole('button', { name: 'Next step' }).should('not.be.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.findByRole('button', { name: 'Next step' }).should('be.disabled')

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'React.js' }).click()
        cy.findByRole('button', { name: 'Next step' }).should('be.disabled')

        // Create-React-Scaffolding was removed in Cypress 14. Users now MUST select a bundler.
        cy.contains('Pick a bundler').click()
        cy.findByRole('option', { name: 'Webpack' }).click()

        cy.findByRole('button', { name: 'Next step' }).should('not.be.disabled')
        cy.findByRole('button', { name: 'Next step' }).click()
        cy.findByRole('button', { name: 'Waiting for you to install the dependencies...' })

        cy.contains('li', 'webpack')
        cy.contains('li', 'react')
        cy.contains('li', 'react-dom')

        cy.findByRole('button', { name: 'Skip' }).click()

        cy.get('[data-cy=valid]').as('valid').contains('cypress.config.js')
        cy.get('@valid').containsPath('cypress/support/component-index.html')
        cy.get('@valid').containsPath('cypress/support/component.js')
        cy.get('@valid').containsPath('cypress/support/commands.js')

        // the files will be scaffolded but an error will eventually throw since we scaffolded with webpack but do NOT have a webpack config present
        verifyScaffoldedFiles('component')
      })

      it('shows the configuration setup page when opened via cli with --e2e flag', () => {
        scaffoldAndOpenProject('pristine-with-e2e-testing', ['--e2e'])
        cy.visitLaunchpad()
        verifyChooseABrowserPage()
      })

      it('can reconfigure config after CT has been set up', () => {
        scaffoldAndOpenProject('pristine-with-ct-testing')
        cy.withCtx((ctx) => {
          ctx.coreData.forceReconfigureProject = {
            component: true,
          }
        })

        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains('Project setup')
      })

      it('can move forward to choose browser if e2e is configured', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="e2e"]').click()

        verifyChooseABrowserPage()
      })

      it('can move forward to choose browser if component is configured', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        verifyChooseABrowserPage()
      })
    })
  })

  describe('Component setup', () => {
    describe('project has been configured for component testing', () => {
      it('skips the setup steps when choosing component tests to run', () => {
        scaffoldAndOpenProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        verifyChooseABrowserPage()
      })

      it('opens to the browser pages when opened via cli with --component flag', () => {
        scaffoldAndOpenProject('pristine-with-ct-testing', ['--component'])
        cy.visitLaunchpad()
        verifyChooseABrowserPage()
      })
    })

    it('opens to the "choose framework" page when opened via cli with --component flag', () => {
      scaffoldAndOpenProject('pristine-with-e2e-testing', ['--component'])
      cy.visitLaunchpad()

      cy.get('h1').should('contain', 'Project setup')
      cy.contains('Confirm the front-end framework and bundler used in your project.')
    })

    describe('project not been configured for cypress', () => {
      it('can setup component testing', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'React.js' }).click()

        cy.contains('Pick a bundler').click()
        cy.findByRole('option', { name: 'Webpack' }).click()

        cy.findByRole('button', { name: 'Next step' }).should('not.be.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'Vue.js 3' }).click()

        cy.findByRole('button', { name: 'Pick a bundler' }).click()
        cy.findByRole('option', { name: 'Vite' }).click()

        cy.findByRole('button', { name: 'Next step' }).should('not.be.disabled')
        cy.findByRole('button', { name: 'Next step' }).click()

        cy.findByRole('button', { name: 'Skip' }).click()

        cy.contains('cypress.config.js')
        cy.containsPath('cypress/support/component-index.html')
        cy.containsPath('cypress/support/component.js')
        cy.containsPath('cypress/support/commands.js')
        cy.containsPath('cypress/fixtures/example.json')

        cy.findByRole('button', { name: 'Continue' }).click()
      })

      it('setup component testing with typescript files', () => {
        scaffoldAndOpenProject('pristine-yarn')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'React.js' }).click()

        cy.contains('Pick a bundler').click()
        cy.findByRole('option', { name: 'Webpack' }).click()

        cy.findByRole('button', { name: 'Next step' }).click()
        cy.findByRole('button', { name: 'Skip' }).click()

        cy.contains('cypress.config.ts')
        cy.containsPath('cypress/support/component-index.html')
        cy.containsPath('cypress/support/component.ts')
        cy.containsPath('cypress/support/commands.ts')
        cy.containsPath('cypress/fixtures/example.json')

        verifyScaffoldedFiles('component')

        cy.findByRole('button', { name: 'Continue' }).click()
      })
    })
  })

  describe('Command for package managers', () => {
    it('makes the right command for yarn', () => {
      scaffoldAndOpenProject('pristine-yarn')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('React.js').click()
      cy.contains('Pick a bundler').click()
      cy.findByRole('option', { name: 'Webpack' }).click()
      cy.contains('button', 'Next step').should('not.be.disabled').click()
      cy.findByDisplayValue('yarn add -D webpack react react-dom').should('be.visible')
    })

    it('makes the right command for pnpm', () => {
      scaffoldAndOpenProject('pristine-pnpm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('React.js').click()
      cy.contains('Pick a bundler').click()
      cy.findByRole('option', { name: 'Vite' }).click()
      cy.contains('button', 'Next step').should('not.be.disabled').click()
      cy.findByDisplayValue('pnpm add -D vite react react-dom')
    })

    // TODO: Had to revert due to regression: https://github.com/cypress-io/cypress/pull/26452
    // Would be great to fully support Plug n Play eventually, but right now it causes issues relating
    // to not correctly detecting dependencies when installing the binary.
    it.skip('works with Yarn 3 Plug n Play', () => {
      scaffoldAndOpenProject('yarn-v3.1.1-pnp')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.contains('button', 'Vue.js 3(detected)').should('be.visible')
      cy.contains('button', 'Vite(detected)').should('be.visible')
      cy.contains('button', 'Next step').should('not.be.disabled').click()
      cy.findByTestId('alert').contains(`You've successfully installed all required dependencies.`)
    })

    it('makes the right command for npm', () => {
      scaffoldAndOpenProject('pristine-npm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('React.js').click()
      cy.contains('Pick a bundler').click()
      cy.findByRole('option', { name: 'Webpack' }).click()
      cy.contains('button', 'Next step').should('not.be.disabled').click()
      cy.findByDisplayValue('npm install -D webpack react react-dom')
    })
  })

  describe('openLink', () => {
    it('opens docs link in the default browser', () => {
      scaffoldAndOpenProject('pristine-with-e2e-testing')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]', { timeout: 10000 }).click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Vue.js 3').click()
      cy.contains('button', 'Pick a bundler').click()
      cy.findByText('Webpack').click()
      cy.findByRole('button', { name: 'Next step' }).should('not.be.disabled').click()
      cy.withCtx(async (ctx) => {
        Object.defineProperty(ctx.coreData, 'scaffoldedFiles', {
          get () {
            return this._scaffoldedFiles.map((scaffold) => {
              if (scaffold.file.absolute.includes('cypress.config')) {
                return { ...scaffold, status: 'changes' }
              }

              return scaffold
            })
          },
          set (scaffoldedFiles) {
            this._scaffoldedFiles = scaffoldedFiles
          },
        })
      })

      cy.findByRole('button', { name: 'Skip' }).click()
      cy.intercept('POST', 'mutation-ExternalLink_OpenExternal', { 'data': { 'openExternal': true } }).as('OpenExternal')
      cy.findByText('Learn more').click()
      cy.wait('@OpenExternal')
      .its('request.body.variables.url')
      .should('equal', 'https://on.cypress.io/guides/configuration')
    })
  })

  describe('switch testing types', () => {
    it('takes the user to first step of e2e setup when switching from app', () => {
      scaffoldAndOpenProject('pristine-with-ct-testing')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

      cy.get('[data-cy-testingtype="component"]').click()
      cy.contains('h1', 'Choose a browser')

      // Execute same function that is called in the browser to switch testing types
      cy.withCtx(async (ctx, { sinon }) => {
        sinon.stub(ctx.actions.browser, 'closeBrowser')
        sinon.stub(ctx.actions.electron, 'refreshBrowserWindow')
        sinon.stub(ctx.actions.electron, 'showBrowserWindow')
        await ctx.actions.project.switchTestingTypesAndRelaunch('e2e')
      })

      cy.reload()

      cy.contains('h1', 'Configuration files')
      verifyScaffoldedFiles('e2e')
    })

    it('takes the user to first step of ct setup when switching from app', () => {
      scaffoldAndOpenProject('pristine-with-e2e-testing')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

      cy.get('[data-cy-testingtype="e2e"]').click()
      cy.contains('h1', 'Choose a browser')

      // Execute same function that is called in the browser to switch testing types
      cy.withCtx(async (ctx, { sinon }) => {
        sinon.stub(ctx.actions.browser, 'closeBrowser')
        sinon.stub(ctx.actions.electron, 'refreshBrowserWindow')
        sinon.stub(ctx.actions.electron, 'showBrowserWindow')
        await ctx.actions.project.switchTestingTypesAndRelaunch('component')
      })

      cy.reload()

      cy.contains('h1', 'Project setup')
    })
  })

  describe('config loading state', () => {
    describe('when currentProject config loading state changes from loading to loaded after the first query', () => {
      beforeEach(() => {
        let responseCount = 0

        cy.intercept('POST', '/__launchpad/graphql/query-MainLaunchpadQuery', (req) => {
          req.reply((res) => {
            responseCount++
            if (responseCount === 2) {
              res.body.data.currentProject.isLoadingConfigFile = false
            } else if (responseCount === 1) {
              res.body.data.currentProject.isLoadingConfigFile = true
            } else {
              throw new Error('Too many calls to MainLaunchpadQuery')
            }
          })
        })
      })

      it('eventually displays the launchpad', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()
      })
    })

    describe('when the initial config is loading, but eventually fails', () => {
      it('shows the error message, and only calls the endpoint enough times to receive the baseError', () => {
        let callCount = 0
        let resWithBaseError: number | undefined

        cy.intercept('POST', '/__launchpad/graphql/query-MainLaunchpadQuery', (req) => {
          if (resWithBaseError && callCount >= resWithBaseError) {
            throw new Error('Too many calls to MainLaunchpadQuery')
          }

          callCount++
          req.reply((res) => {
            res.body.data.currentProject.isLoadingConfigFile = true
            if (res.body.data.baseError) {
              resWithBaseError = callCount
            }
          })
        })

        scaffoldAndOpenProject('config-with-ts-syntax-error')
        cy.visitLaunchpad()
        cy.get('[data-cy=error-header]').contains('Cypress configuration error')
        cy.wait(1000)
      })
    })
  })
})
