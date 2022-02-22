import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

// declare global {
//   namespace Cypress {
//     interface Chainable {
//       waitForWizard(): Cypress.Chainable<JQuery<HTMLDivElement>>
//     }
//   }
// }

// Cypress.Commands.add('waitForWizard', () => {
//   return cy.get('[data-cy="migration-wizard"]')
// })

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
      startSetupFor('unconfigured-vueclivue2')

      // should detect correctly
      cy.get('button').should('be.visible').contains('Vue CLI (Vue 2)(detected)')
      cy.get('button').contains('Next Step').click()
      const deps = ['@cypress/vue', '@cypress/webpack-dev-server']
      deps.forEach(dep => {
        cy.contains(dep)
      })

      cy.withCtx((ctx, { deps }) => {
        ctx.update(coreData => {
          coreData.wizard.__fakeInstalledPackagesForTesting = deps
        })
      }, { deps })

      cy.findByRole('button', { name: 'Continue' }).click()
      verifyConfigFile(`cypress.config.js`)
    })
  })
})
