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

    // Delete the fixtures folder so it scaffold correctly the example
    cy.withCtx(async (ctx) => {
      await ctx.actions.file.removeFileInProject('cypress/fixtures')
    })
  }

  const verifyWelcomePage = ({ e2eIsConfigured, ctIsConfigured }) => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('[data-cy-testingtype="e2e"]', e2eIsConfigured ? 'Configured' : 'Not Configured')
    cy.contains('[data-cy-testingtype="component"]', ctIsConfigured ? 'Configured' : 'Not Configured')
  }

  const verifyChooseABrowserPage = () => {
    cy.contains('Choose a Browser', { timeout: 15000 })

    cy.findByRole('radio', { name: 'Chrome v1' })
    cy.findByRole('radio', { name: 'Firefox v5' })
    cy.findByRole('radio', { name: 'Electron v12' })
    cy.findByRole('radio', { name: 'Edge v8' })
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

    cy.contains('h1', 'Configuration Files')
    cy.findByText('We added the following files to your project:')

    cy.get('[data-cy=valid]').within(() => {
      cy.contains('cypress.config.js')
      cy.containsPath('cypress/support/e2e.js')
      cy.containsPath('cypress/support/commands.js')
      cy.containsPath('cypress/fixtures/example.json')
    })

    verifyScaffoldedFiles('e2e')
  })

  it('opens correctly in unconfigured project with --component', () => {
    cy.scaffoldProject('pristine')
    cy.openProject('pristine', ['--component'])
    cy.visitLaunchpad()
    cy.get('h1').should('contain', 'Project Setup')
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

      cy.findByRole('dialog', { name: 'Key Differences' }).should('be.visible')
      cy.contains('Need help').should('be.visible')

      cy.get('[data-cy="end-to-end-comparison"]').within(() => {
        cy.contains('End-to-end Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })

      cy.get('[data-cy="component-comparison"]').within(() => {
        cy.contains('Component Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })
    })

    it('close modal with escape key', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')

      cy.get('body').type('{esc}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by clicking outside of modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')

      cy.get('body').click(5, 5)
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by clicking close button', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key Differences').should('be.visible')
      })

      cy.findByRole('button', { name: 'Close' }).click()
      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestingTypes').should('not.exist')
    })

    it('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key Differences').should('be.visible')

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

      cy.findByRole('dialog', { name: 'Key Differences' })
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

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: true })

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

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.containsPath('cypress/support/e2e.js')
          cy.containsPath('cypress/support/commands.js')
          cy.containsPath('cypress/fixtures/example.json')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.have.disabled')
        .click()

        verifyChooseABrowserPage()
      })

      it('moves to "Choose a Browser" page after clicking "Continue" button in first step in configuration page', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.containsPath('cypress/support/e2e.js')
          cy.containsPath('cypress/support/commands.js')
          cy.containsPath('cypress/fixtures/example.json')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.have.disabled')
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

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.containsPath('cypress/support/e2e.js')
          cy.containsPath('cypress/support/commands.js')
          cy.containsPath('cypress/fixtures/example.json')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.have.disabled')
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

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project:')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.ts')
          cy.containsPath('cypress/support/e2e.ts')
          cy.containsPath('cypress/support/commands.ts')
          cy.containsPath('cypress/fixtures/example.json')
        })

        verifyScaffoldedFiles('e2e')

        cy.findByRole('button', { name: 'Continue' })
        .should('not.have.disabled')
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
        cy.findByRole('option', { name: 'Create React App' }).click()

        cy.get('[data-testid="select-bundler"').should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.findByRole('button', { name: 'Next Step' }).should('have.disabled')

        cy.contains('Pick a framework').click()
        cy.findByRole('option', { name: 'Create React App' }).click()
        cy.findByRole('button', { name: 'Bundler(Dev Server) Webpack' }).should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Next Step' }).click()
        cy.findByRole('button', { name: 'Waiting for you to install the dependencies...' })

        cy.contains('li', 'webpack')
        cy.contains('li', 'react-scripts')
        cy.contains('li', 'react')

        cy.findByRole('button', { name: 'Skip' }).click()

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.containsPath('cypress/support/component-index.html')
          cy.containsPath('cypress/support/component.js')
          cy.containsPath('cypress/support/commands.js')
        })

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

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains('Project Setup')
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

      cy.get('h1').should('contain', 'Project Setup')
      cy.contains('Confirm the front-end framework and bundler used in your project.')
    })

    describe('project not been configured for cypress', () => {
      // TODO: unskip once Object API lands https://github.com/cypress-io/cypress/pull/20861
      it.skip('can setup component testing', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', { name: 'Front-end Framework React.js (detected)' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()

        cy.get('[data-testid="select-bundler"').should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.findByRole('button', { name: 'Front-end Framework React.js (detected)' }).click()
        cy.findByRole('option', { name: 'Vue.js 3' }).click()

        cy.findByRole('button', { name: 'Bundler(Dev Server) Pick a bundler' }).click()
        cy.findByRole('option', { name: 'Vite' }).click()

        cy.findByRole('button', { name: 'TypeScript' }).click()
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')
        cy.findByRole('button', { name: 'Next Step' }).click()

        cy.findByRole('button', { name: 'Skip' }).click()

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.ts')
          cy.containsPath('cypress/support/component-index.html')
          cy.containsPath(`cypress/support/component.ts`)
          cy.containsPath(`cypress/support/commands.ts`)
          cy.containsPath('cypress/fixtures/example.json')
        })

        cy.findByRole('button', { name: 'Continue' }).click()

        verifyChooseABrowserPage()
      })

      // TODO: unskip once Object API lands https://github.com/cypress-io/cypress/pull/20861
      it.skip('setup component testing with typescript files', () => {
        scaffoldAndOpenProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', { name: 'Front-end Framework React.js (detected)' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()
        cy.findByRole('button', { name: 'TypeScript' }).click()

        cy.findByRole('button', { name: 'Next Step' }).click()
        cy.findByRole('button', { name: 'Skip' }).click()

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.ts')
          cy.containsPath('cypress/support/component-index.html')
          cy.containsPath('cypress/support/component.ts')
          cy.containsPath('cypress/support/commands.ts')
          cy.containsPath('cypress/fixtures/example.json')
        })

        verifyScaffoldedFiles('component')

        cy.findByRole('button', { name: 'Continue' }).click()

        verifyChooseABrowserPage()
      })
    })
  })

  describe('Command for package managers', () => {
    it('makes the right command for yarn', () => {
      scaffoldAndOpenProject('pristine-yarn')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'yarn add -D ')
    })

    it('makes the right command for pnpm', () => {
      scaffoldAndOpenProject('pristine-pnpm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'pnpm install -D ')
    })

    it('makes the right command for npm', () => {
      scaffoldAndOpenProject('pristine-npm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'npm install -D ')
    })
  })

  describe('openLink', () => {
    it('opens docs link in the default browser', () => {
      scaffoldAndOpenProject('pristine-with-e2e-testing')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Vue.js 3').click()
      cy.contains('button', 'Pick a bundler').click()
      cy.findByText('Webpack').click()
      cy.findByRole('button', { name: 'Next Step' }).should('not.be.disabled').click()
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
      cy.contains('h1', 'Choose a Browser')

      // Execute same function that is called in the browser to switch testing types
      cy.withCtx(async (ctx, { sinon }) => {
        sinon.stub(ctx.actions.browser, 'closeBrowser')
        sinon.stub(ctx.actions.electron, 'refreshBrowserWindow')
        sinon.stub(ctx.actions.electron, 'showBrowserWindow')
        await ctx.actions.project.switchTestingTypesAndRelaunch('e2e')
      })

      cy.reload()

      cy.contains('h1', 'Configuration Files')
      verifyScaffoldedFiles('e2e')
    })

    it('takes the user to first step of ct setup when switching from app', () => {
      scaffoldAndOpenProject('pristine-with-e2e-testing')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

      cy.get('[data-cy-testingtype="e2e"]').click()
      cy.contains('h1', 'Choose a Browser')

      // Execute same function that is called in the browser to switch testing types
      cy.withCtx(async (ctx, { sinon }) => {
        sinon.stub(ctx.actions.browser, 'closeBrowser')
        sinon.stub(ctx.actions.electron, 'refreshBrowserWindow')
        sinon.stub(ctx.actions.electron, 'showBrowserWindow')
        await ctx.actions.project.switchTestingTypesAndRelaunch('component')
      })

      cy.reload()

      cy.contains('h1', 'Project Setup')
    })
  })
})
