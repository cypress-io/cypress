import type { ProjectFixtureDir } from '@tooling/system-tests'

function startSetupFor (project: ProjectFixtureDir) {
  cy.scaffoldProject(project)
  cy.openProject(project)
  cy.visitLaunchpad()
  cy.skipWelcome()

  cy.contains('Component Testing').click()
  cy.get(`[data-testid="select-framework"]`)
}

// TODO: assert against all scaffolded files once
// https://github.com/cypress-io/cypress/pull/20818 is merged
function verifyConfigFile (configFile: `cypress.config.${'js' | 'ts'}`) {
  cy.withCtx(async (ctx, o) => {
    const configStats = await ctx.file.checkIfFileExists(o.configFile)

    expect(configStats).to.not.be.null.and.not.be.undefined
  }, { configFile })
}

const ONE_MINUTE = 1000 * 60

describe('scaffolding component testing', {
  taskTimeout: ONE_MINUTE,
}, () => {
  context('vuecli4vue2', () => {
    it('scaffolds component testing for Vue CLI 4 w/ Vue 2 project', () => {
      startSetupFor('vueclivue2-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 2)(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('vuecli4vue3', () => {
    it('scaffolds component testing for Vue CLI 4 w/ Vue 3 project', () => {
      startSetupFor('vueclivue3-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 3)(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('vuecli5vue3', () => {
    it('scaffolds component testing for Vue CLI 5 w/ Vue 3 project', () => {
      startSetupFor('vuecli5vue3-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 3)(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('create-react-app', () => {
    it('scaffolds component testing for Create React App v5 project', () => {
      startSetupFor('create-react-app-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Create React App(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('react-vite-ts-unconfigured', () => {
    it('scaffolds component testing for React and Vite', () => {
      startSetupFor('react-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('React.js(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('vue3-vite-ts-unconfigured', () => {
    it('scaffolds component testing for Vue 3 and Vite', () => {
      startSetupFor('vue3-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue.js 3(detected)')
      cy.get('button').contains('Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('nuxtjs-vue2-unconfigured', () => {
    it('scaffolds component testing for Nuxt 2', () => {
      startSetupFor('nuxtjs-vue2-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', /Nuxt\.js \(v2\)\s+Support is in\s+Alpha\(detected\)/).should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('angular-cli-unconfigured', () => {
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23452
    it.skip('scaffolds component testing for Angular', () => {
      startSetupFor('angular-cli-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', 'Angular(detected)').should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('svelte-vite-unconfigured', () => {
    it('Scaffolds component testing for Svelte using vite', () => {
      startSetupFor('svelte-vite-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', /Svelte\.js\s+Support is in\s+Alpha\(detected\)/).should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('svelte-webpack-unconfigured', () => {
    it('Scaffolds component testing for Svelte using webpack', () => {
      startSetupFor('svelte-webpack-unconfigured')

      // should detect correctly
      // Screen reader text is "Support is in", but don't want to rely on DOM introduced whitespace so using regex
      cy.contains('button', /Svelte\.js\s+Support is in\s+Alpha\(detected\)/).should('be.visible')
      cy.contains('button', 'Next step').click()
      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })
})
