import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

function startSetupFor (project: typeof e2eProjectDirs[number]) {
  cy.scaffoldProject(project)
  cy.openProject(project)
  cy.visitLaunchpad()
  cy.contains('Component Testing').click()
  cy.get(`[data-testid="select-framework"]`)
}

function verifyConfigFile (configFile: `cypress.config.${'js' | 'ts'}`) {
  cy.withCtx(async (ctx, o) => {
    const configStats = await ctx.file.checkIfFileExists(o.configFile)

    expect(configStats).to.not.be.null.and.not.be.undefined

    await ctx.actions.migration.assertSuccessfulConfigScaffold(o.configFile)
  }, { configFile })
}

function fakeInstalledDeps () {
  cy.withCtx(async (ctx, o) => {
    const deps = (await ctx.wizard.packagesToInstall() ?? []).map((x) => x.package)

    o.sinon.stub(ctx.wizard, 'installedPackages').resolves(deps)
  })
}

describe('scaffolding component testing', () => {
  context('vuecli4vue2', () => {
    it('scaffolds component testing for Vue CLI 4 w/ Vue 2 project', () => {
      startSetupFor('vueclivue2-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI 4 (Vue 2)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('vuecli4vue3', () => {
    it('scaffolds component testing for Vue CLI 4 w/ Vue 3 project', () => {
      startSetupFor('vueclivue3-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI 4 (Vue 3)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('vuecli5vue3', () => {
    it('scaffolds component testing for Vue CLI 5 w/ Vue 3 project', () => {
      startSetupFor('vuecli5vue3-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI 5 (Vue 3)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('create-react-app', () => {
    it('scaffolds component testing for Create React App v5 project', () => {
      startSetupFor('create-react-app-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Create React App (v5)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('react-vite-ts-unconfigured', () => {
    it('scaffolds component testing for React and Vite', () => {
      startSetupFor('react-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('React.js(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('vue3-vite-ts-unconfigured', () => {
    it('scaffolds component testing for Vue 3 and Vite', () => {
      startSetupFor('vue3-vite-ts-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue.js (v3)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.ts`)
    })
  })

  context('nuxtjs-vue2-unconfigured', () => {
    it('scaffolds component testing for Nuxt 2', () => {
      startSetupFor('nuxtjs-vue2-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Nuxt.js (v2)(detected)')
      cy.get('button').contains('Next Step').click()

      fakeInstalledDeps()

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })
})
