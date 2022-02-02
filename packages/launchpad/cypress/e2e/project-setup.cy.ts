import { FRONTEND_FRAMEWORKS, BUNDLERS, CODE_LANGUAGES, PACKAGES_DESCRIPTIONS } from '@packages/types/src/constants'

describe('Launchpad: Setup Project', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine') // not configured
    cy.scaffoldProject('pristine-with-ct-testing') // component configured
    cy.scaffoldProject('pristine-with-e2e-testing') // e2e configured
    cy.scaffoldProject('pristine-with-e2e-testing-and-storybook') // e2e configured
    cy.scaffoldProject('pristine-npm')
    cy.scaffoldProject('pristine-yarn')
    cy.scaffoldProject('pristine-pnpm')
  })

  const verifyWelcomePage = ({ e2eIsConfigured, ctIsConfigured }) => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('[data-cy-testingtype="e2e"]', e2eIsConfigured ? 'Configured' : 'Not Configured')
    cy.contains('[data-cy-testingtype="component"]', ctIsConfigured ? 'Configured' : 'Not Configured')
  }

  it('no initial setup displays welcome page', () => {
    cy.openProject('pristine')
    cy.visitLaunchpad()
    cy.contains('Welcome to Cypress!').should('be.visible')
    verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
  })

  describe('"learn about testing types" modal', () => {
    beforeEach(() => {
      cy.openProject('pristine')
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

    // Cypress enter key down isn't trigger close callback. Working correctly when manually tested
    // or when using the cypress-real-evens plugin.
    // Could be related to this bug? https://github.com/cypress-io/cypress/issues/14864
    // FIXME: https://github.com/cypress-io/cypress/pull/19726
    it.skip('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key Differences').should('be.visible')

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.findByRole('button', { name: 'Close' })
        .should('have.focus')
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
          href: 'https://on.cypress.io',
        })
      })
    })
  })

  describe('E2E test setup', () => {
    describe('project has been configured for e2e', () => {
      it('skips the setup page when choosing e2e tests to run', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-e2e-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    // project has a cypress.configuration file with component testing configured
    describe('project that has not been configured for e2e', () => {
      // FIXME: ProjectLifecycleManager is skipping straight to browser pages when it should show setup page.
      it.skip('shows the configuration setup page when selecting e2e tests', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      // FIXME: ProjectLifecycleManager is skipping straight to browser pages when it should show setup page.
      it.skip('moves to "Choose a Browser" page after clicking "Continue" button in first step in configuration page', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      it('shows the configuration setup page when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.contains('h1', 'Configuration Files')
        cy.contains('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })
    })

    describe('project not been configured for cypress', () => {
      it('can go back before selecting e2e scaffold lang', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Project Setup')
        cy.findByRole('button', { name: 'Back' }).click()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
      })

      it('can setup e2e testing for a project selecting JS', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Project Setup')
        cy.findByRole('button', { name: 'JavaScript' }).click()
        cy.findByRole('button', { name: 'Next Step' }).click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })

        cy.findByRole('button', { name: 'Continue' })
        .should('not.have.disabled')
        .click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('can setup e2e testing for a project selecting TS', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Project Setup')
        cy.findByRole('button', { name: 'TypeScript' }).click()
        cy.findByRole('button', { name: 'Next Step' }).click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.ts')
          cy.contains('cypress/support/e2e.ts')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      it('can setup e2e testing for a project selecting TS when CT is configured and config file is JS', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.contains('button', 'E2E Testing')
        .should('have.focus')
        .realPress('Enter')

        cy.contains('h1', 'Project Setup')
        cy.findByRole('button', { name: 'TypeScript' }).click()
        cy.findByRole('button', { name: 'Next Step' }).click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.ts')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      it('can setup CT testing for a project selecting TS when E2E is configured and config file is JS', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', { name: 'Front-end Framework Pick a framework' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()

        cy.get('[data-testid="select-bundler"').should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.findByRole('button', { name: 'Front-end Framework Create React App' }).click()
        cy.findByRole('option', { name: 'React.js' }).click()

        cy.findByRole('button', { name: 'Next Step' }).should('have.disabled')

        cy.findByRole('button', { name: 'Bundler Pick a bundler' }).click()
        cy.findByRole('option', { name: 'Webpack' }).click()
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Front-end Framework React.js' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()
        cy.findByRole('button', { name: 'Bundler Webpack' }).should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'TypeScript' }).click()

        cy.findByRole('button', { name: 'Next Step' }).click()
        cy.findByRole('button', { name: 'I\'ve installed them' }).click()

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/component/index.html')
          cy.contains(`cypress/support/component.ts`)
        })

        cy.findByRole('button', { name: 'Continue' }).should('have.disabled')
      })

      it('shows the configuration setup page when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.contains('h1', 'Configuration Files')
        cy.contains('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })
    })
  })

  describe('Component setup', () => {
    describe('project has been configured for component testing', () => {
      it('skips the setup steps when choosing component tests to run', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --component flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    describe('project that has not been configured for component testing', () => {
      it('shows the first setup page for configuration when selecting component tests', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', {
          name: 'Front-end Framework Pick a framework',
          expanded: false,
        })
        .should('have.attr', 'aria-haspopup', 'true')

        cy.findByRole('button', { name: 'Next Step' }).should('have.disabled')

        cy.findByRole('button', { name: 'Back' }).click()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })
      })

      const hasStorybookPermutations = [false, true]

      FRONTEND_FRAMEWORKS.forEach((framework) => {
        hasStorybookPermutations.forEach((hasStorybookDep) => {
          framework.supportedBundlers.forEach((testBundler) => {
            const bundler = BUNDLERS.find((b) => b.type === testBundler)

            if (!bundler) {
              throw new Error(`${framework.name} claims to support the bundler, ${testBundler}, however it is not a valid Cypress bundler.`)
            }

            CODE_LANGUAGES.forEach((lang) => {
              let testTitle = `can setup ${framework.name} + ${lang.name}`

              if (framework.supportedBundlers.length > 1) {
                testTitle = `can setup ${framework.name} + ${bundler.name} + ${lang.name}`
              }

              if (hasStorybookDep) {
                testTitle += ` for project using Storybook`
              }

              it(testTitle, () => {
                cy.openProject(hasStorybookDep ? 'pristine-with-e2e-testing-and-storybook' : 'pristine-with-e2e-testing')
                cy.withCtx((ctx) => {
                  ctx.actions.file.writeFileInProject('yarn.lock', '# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.')
                })

                cy.visitLaunchpad()

                verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

                cy.get('[data-cy-testingtype="component"]').click()

                cy.log('Choose project setup')
                cy.get('h1').should('contain', 'Project Setup')
                cy.contains('Confirm the front-end framework and bundler used in your project.')

                cy.findByRole('button', { name: 'Next Step' })
                .should('have.disabled')
                .as('nextStepButton')

                cy.findByRole('button', {
                  name: 'Front-end Framework Pick a framework',
                  expanded: false,
                })
                .click()

                cy.findByRole('option', { name: framework.name }).click()
                cy.findByRole('button', { name: `Front-end Framework ${framework.name}` }) // ensure selected option updates

                if (framework.supportedBundlers.length > 1) {
                  cy.findByRole('button', {
                    name: 'Bundler Pick a bundler',
                    expanded: false,
                  })
                  .should('have.attr', 'aria-haspopup', 'true')
                  .click()
                  .should('have.attr', 'aria-expanded', 'true')

                  framework.supportedBundlers.forEach((supportedBundler) => {
                    cy.findByRole('option', { name: Cypress._.startCase(supportedBundler) })
                    .find('svg')
                    .should('have.attr', 'data-cy', `${Cypress._.lowerCase(supportedBundler)}-logo`)
                  })

                  cy.findByRole('option', { name: bundler.name })
                  .find('svg')
                  .should('have.attr', 'data-cy', `${Cypress._.lowerCase(bundler.name)}-logo`)
                  .click()

                  cy.findByRole('button', { name: `Bundler ${bundler.name}` }) // ensure selected option updates
                }

                cy.findByRole('button', { name: lang.name }).click()

                cy.log('Go to next step')
                cy.get('@nextStepButton').should('not.have.disabled').click()

                cy.contains('h1', 'Install Dev Dependencies')
                cy.contains('p', 'Paste the command below into your terminal to install the required packages.')

                cy.log('Return to previous step')
                cy.findByRole('button', { name: 'Back' })
                .click()

                cy.findByRole('button', { name: `Front-end Framework ${framework.name}` })
                if (framework.supportedBundlers.length > 1) {
                  cy.findByRole('button', { name: `Bundler ${bundler.name}` })
                }

                cy.findByRole('button', { name: lang.name })
                cy.findByRole('button', { name: 'Next Step' }).click()

                cy.log('Go to next step and verify Install Dev Dependencies page')
                cy.contains('h1', 'Install Dev Dependencies')

                let installCommand = `npm install -D ${framework.package} ${bundler.package}`

                if (hasStorybookDep) {
                  installCommand += ` ${framework.storybookDep}`
                }

                cy.contains('code', installCommand)

                const validatePackage = (packageName) => {
                  cy.validateExternalLink({
                    name: packageName,
                    href: `https://www.npmjs.com/package/${packageName}`,
                  })

                  cy.contains(PACKAGES_DESCRIPTIONS[framework.package].split('<span')[0])
                }

                validatePackage(framework.package)
                validatePackage(bundler.package)
                if (hasStorybookDep) {
                  validatePackage(framework.storybookDep)
                }

                cy.findByRole('button', { name: 'I\'ve installed them' }).click()

                // FIXME: remove if-check once this is fixed. https://cypress-io.atlassian.net/browse/UNIFY-980
                if (lang.type !== 'ts') {
                  cy.get('[data-cy=changes]').within(() => {
                    cy.contains('cypress.config.js')
                  })
                }

                cy.get('[data-cy=valid]').within(() => {
                  cy.contains('cypress/component/index.html')
                  cy.contains(`cypress/support/component.${lang.type}`)
                  cy.contains('cypress/fixtures/example.json')
                })
              })
            })
          })
        })
      })

      it('opens to the "choose framework" page when opened via cli with --component flag', () => {
        cy.openProject('pristine-with-e2e-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')
      })
    })

    describe('project not been configured for cypress', () => {
      it('can setup component testing', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', { name: 'Front-end Framework Pick a framework' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()

        cy.get('[data-testid="select-bundler"').should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Back' }).click()
        cy.get('[data-cy-testingtype="component"]').click()

        cy.findByRole('button', { name: 'Front-end Framework Create React App' }).click()
        cy.findByRole('option', { name: 'React.js' }).click()

        cy.findByRole('button', { name: 'Next Step' }).should('have.disabled')

        cy.findByRole('button', { name: 'Bundler Pick a bundler' }).click()
        cy.findByRole('option', { name: 'Webpack' }).click()
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Front-end Framework React.js' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()
        cy.findByRole('button', { name: 'Bundler Webpack' }).should('not.exist')
        cy.findByRole('button', { name: 'Next Step' }).should('not.have.disabled')

        cy.findByRole('button', { name: 'Next Step' }).click()
        cy.findByRole('button', { name: 'I\'ve installed them' }).click()

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.js')
          cy.contains('cypress/component/index.html')
          cy.contains(`cypress/support/component.js`)
          cy.contains('cypress/fixtures/example.json')
        })

        // Fix me: https://cypress-io.atlassian.net/browse/UNIFY-981
        // cy.findByRole('button', { name: 'Continue' }).click()
        // cy.contains(/(Initializing Config|Choose a Browser)/)
        cy.findByRole('button', { name: 'Continue' }).click()
        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the "choose framework" page when opened via cli with --component flag', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        cy.contains('button', 'Component Testing')
        .focus()
        .realPress('Enter')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')

        cy.findByRole('button', { name: 'Front-end Framework Pick a framework' }).click()
        cy.findByRole('option', { name: 'Create React App' }).click()
        cy.findByRole('button', { name: 'TypeScript' }).click()
        cy.findByRole('button', { name: 'Next Step' }).click()
        cy.findByRole('button', { name: 'I\'ve installed them' }).click()

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress.config.ts')
          cy.contains('cypress/component/index.html')
          cy.contains(`cypress/support/component.ts`)
          cy.contains('cypress/fixtures/example.json')
        })

        // Fix me: https://cypress-io.atlassian.net/browse/UNIFY-981
        // cy.findByRole('button', { name: 'Continue' }).click()
        // cy.contains(/(Initializing Config|Choose a Browser)/)
      })
    })
  })

  describe('Command for package managers', () => {
    it('makes the right command for yarn', () => {
      cy.openProject('pristine-yarn')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'yarn add -D ')
    })

    it('makes the right command for pnpm', () => {
      cy.openProject('pristine-pnpm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'pnpm install -D ')
    })

    it('makes the right command for npm', () => {
      cy.openProject('pristine-npm')

      cy.visitLaunchpad()

      cy.get('[data-cy-testingtype="component"]').click()
      cy.get('[data-testid="select-framework"]').click()
      cy.findByText('Create React App').click()
      cy.findByText('Next Step').click()
      cy.get('code').should('contain.text', 'npm install -D ')
    })
  })
})
