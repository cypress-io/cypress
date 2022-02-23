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
    const configStats = await ctx.actions.file.checkIfFileExists(o.configFile)

    expect(configStats).to.not.be.null.and.not.be.undefined

    await ctx.actions.migration.assertSuccessfulConfigScaffold(o.configFile)
  }, { configFile })
}

describe('scaffolding component testing', () => {
  context('vueclivue2', () => {
    it('scaffolds component testing for Vue CLI w/ Vue 2 project', () => {
      startSetupFor('vueclivue2-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 2)(detected)')
      cy.get('button').contains('Next Step').click()
      const deps = ['@cypress/vue', '@cypress/webpack-dev-server']

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('vueclivue3', () => {
    it('scaffolds component testing for Vue CLI w/ Vue 3 project', () => {
      startSetupFor('vueclivue3-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 3)(detected)')
      cy.get('button').contains('Next Step').click()
      const deps = ['@cypress/vue', '@cypress/webpack-dev-server']

      // correct install command and versions
      cy.contains('npm install -D @cypress/vue@^3.0.0 @cypress/webpack-dev-server@latest')

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })

  context('create-react-app', () => {
    it('scaffolds component testing for Vue CLI w/ Vue 2 project', () => {
      startSetupFor('create-react-app-unconfigured')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Create React App(detected)')
      cy.get('button').contains('Next Step').click()
      const deps = ['@cypress/react', '@cypress/webpack-dev-server']

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

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
      const deps = ['@cypress/react', '@cypress/vite-dev-server']

      // correct install command and versions
      cy.contains('npm install -D @cypress/react@^5.0.0 @cypress/vite-dev-server@latest')

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

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
      const deps = ['@cypress/vue', '@cypress/vite-dev-server']

      // correct install command and versions
      cy.contains('npm install -D @cypress/vue@^3.0.0 @cypress/vite-dev-server@latest')

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

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
      const deps = ['@cypress/vue', '@cypress/webpack-dev-server', 'html-webpack-plugin']

      // correct install command and versions
      cy.contains('npm install -D @cypress/vue@^2.0.0 html-webpack-plugin@^4.0.0 @cypress/webpack-dev-server@latest')

      deps.forEach((dep) => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update((coreData) => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })
})
