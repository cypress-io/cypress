import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

const renameAutoStep = `[data-cy="migration-step renameAuto"]`
const renameManualStep = `[data-cy="migration-step renameManual"]`
const renameSupportStep = `[data-cy="migration-step renameSupport"]`
const configFileStep = `[data-cy="migration-step configFile"]`
const setupComponentStep = `[data-cy="migration-step setupComponent"]`

declare global {
  namespace Cypress {
    interface Chainable {
      waitForWizard(): Cypress.Chainable<JQuery<HTMLDivElement>>
    }
  }
}

Cypress.Commands.add('waitForWizard', () => {
  return cy.get('[data-cy="migration-wizard"]')
})

function startMigrationFor (project: typeof e2eProjectDirs[number]) {
  cy.scaffoldProject(project)
  cy.openProject(project)
  cy.visitLaunchpad()
  cy.waitForWizard()
}

describe.only('Steps', () => {
  it('completes journey for migration-component-testing', () => {
    startMigrationFor('migration-component-testing')
    // custom testFiles - cannot auto
    cy.get(renameAutoStep).should('not.exist')
    cy.get(renameManualStep).should('exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('not.exist')
    cy.get(setupComponentStep).should('exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-component-testing-customized', () => {
    startMigrationFor('migration-component-testing-customized')
    // custom testFiles - cannot auto
    cy.get(renameAutoStep).should('not.exist')
    cy.get(renameManualStep).should('exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('not.exist')
    cy.get(setupComponentStep).should('exist')
    cy.get(configFileStep).should('exist')
  })

  // FAILS
  it.only('completes journey for migration-component-testing-defaults', () => {
    startMigrationFor('migration-component-testing-defaults')
    // default testFiles - auto
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('not.exist')
    cy.get(setupComponentStep).should('exist')
    cy.get(configFileStep).should('exist')
  })

  // FAILS
  it('completes journey for migration-e2e-component-default-everything', () => {
    startMigrationFor('migration-e2e-component-default-everything')
    // default testFiles - auto
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('exist')
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('exist')
    cy.get(configFileStep).should('exist')
  })

  // FAILS
  it('completes journey for migration-e2e-component-default-test-files', () => {
    startMigrationFor('migration-e2e-component-default-test-files')
    // default testFiles - auto
    cy.get(renameAutoStep).should('exist')
    cy.get(renameManualStep).should('exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-e2e-custom-integration', () => {
    startMigrationFor('migration-e2e-custom-integration')
    // default testFiles but custom integration - can rename automatically
    cy.get(renameAutoStep).should('exist')
    // no CT
    cy.get(renameManualStep).should('not.exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-e2e-custom-test-files', () => {
    startMigrationFor('migration-e2e-custom-test-files')
    // default integration but custom testFiles 
    // can rename integration->e2e
    cy.get(renameAutoStep).should('exist')
    // no CT
    cy.get(renameManualStep).should('not.exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-e2e-defaults', () => {
    startMigrationFor('migration-e2e-defaults')
    // defaults, rename all the things
    // can rename integration->e2e
    cy.get(renameAutoStep).should('exist')
    // no CT
    cy.get(renameManualStep).should('not.exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-e2e-defaults-no-specs', () => {
    startMigrationFor('migration-e2e-defaults-no-specs')
    // no specs, nothing to rename?
    cy.get(renameAutoStep).should('not.exist')
    // no CT
    cy.get(renameManualStep).should('not.exist')
    // supportFile is false - cannot migrate
    cy.get(renameSupportStep).should('exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

  it('completes journey for migration-e2e-fully-custom', () => {
    startMigrationFor('migration-e2e-fully-custom')
    // integration folder and testFiles are custom, cannot rename anything
    cy.get(renameAutoStep).should('not.exist')
    // no CT
    cy.get(renameManualStep).should('not.exist')
    // supportFile is custom - cannot rename
    cy.get(renameSupportStep).should('not.exist')
    cy.get(setupComponentStep).should('not.exist')
    cy.get(configFileStep).should('exist')
  })

//   it('only all steps for kitchen sink migration project', () => {
//     cy.get(renameAutoStep).should('exist')
//     cy.get(renameManualStep).should('exist')
//     cy.get(renameSupportStep).should('exist')
//     cy.get(setupComponentStep).should('exist')
//     cy.get(configFileStep).should('exist')
//   })

//   // note: see the README.md inside each of these projects
//   // to understand why certain steps are shown.
//   // eg system-tests/migration-e2e-fully-custom/README.md
//   it('only shows update config file for highly customized project', () => {
//     cy.scaffoldProject('migration-e2e-fully-custom')
//     cy.openProject('migration-e2e-fully-custom')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     cy.get(renameAutoStep).should('not.exist')
//     cy.get(renameManualStep).should('not.exist')
//     cy.get(renameSupportStep).should('not.exist')
//     cy.get(setupComponentStep).should('not.exist')
//     cy.get(configFileStep).should('exist')
//   })

//   it('shows auto and manual rename for component project with defaults', () => {
//     cy.scaffoldProject('migration-component-testing-defaults')
//     cy.openProject('migration-component-testing-defaults')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     cy.get(renameAutoStep).should('exist')
//     cy.get(renameManualStep).should('exist')
//     cy.get(renameSupportStep).should('not.exist')
//     cy.get(setupComponentStep).should('exist')
//     cy.get(configFileStep).should('exist')
//   })

//   it('shows all e2e steps for an e2e project with all defaults', () => {
//     cy.scaffoldProject('migration-e2e-defaults')
//     cy.openProject('migration-e2e-defaults')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     cy.get(renameAutoStep).should('exist')
//     cy.get(renameManualStep).should('not.exist')
//     cy.get(renameSupportStep).should('exist')
//     cy.get(configFileStep).should('exist')
//     cy.get(setupComponentStep).should('not.exist')
//   })

//   it('shows all e2e steps for an e2e project with custom testFiles', () => {
//     cy.scaffoldProject('migration-e2e-custom-test-files')
//     cy.openProject('migration-e2e-custom-test-files')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     cy.get(renameAutoStep).should('exist')
//     cy.get(renameManualStep).should('not.exist')
//     cy.get(renameSupportStep).should('exist')
//     cy.get(configFileStep).should('exist')
//     cy.get(setupComponentStep).should('not.exist')
//   })

//   it('shows all e2e steps for an e2e project with custom testFiles', () => {
//     cy.scaffoldProject('migration-e2e-custom-test-files')
//     cy.openProject('migration-e2e-custom-test-files')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     cy.get(renameAutoStep).should('exist')
//     cy.get(renameManualStep).should('not.exist')
//     cy.get(renameSupportStep).should('exist')
//     cy.get(configFileStep).should('exist')
//     cy.get(setupComponentStep).should('not.exist')
//   })

//   it('shows all component steps for a component testing project w/o e2e set up', () => {
//     cy.scaffoldProject('migration-component-testing-customized')
//     cy.openProject('migration-component-testing-customized')
//     cy.visitLaunchpad()
//     cy.waitForWizard()
//     // cannot rename specs automatically because this project
//     // uses a custom testFiles pattern.
//     cy.get(renameAutoStep).should('not.exist')

//     // you'll need to migrate manaully.
//     cy.get(renameManualStep).should('exist')

//     // supportFile: false in this project
//     cy.get(renameSupportStep).should('not.exist')
//     cy.get(configFileStep).should('exist')

//     // we require re-configuring component testing,
//     // even if you already had it set up.
//     cy.get(setupComponentStep).should('exist')
//   })
})

describe('component testing migration - defaults', () => {
  // TODO: toApp emitter not working in Cypress in Cypress.
  it.skip('live update migration UI as user moves files', () => {
    cy.scaffoldProject('migration-component-testing-customized')
    cy.openProject('migration-component-testing-customized')
    cy.visitLaunchpad()
    cy.waitForWizard()

    // need to move your specs before this button shows
    cy.get('button').contains('I have moved my component specs').should('not.exist')

    // two files to move, src/button.spec.js and src/input-spec.tsx.
    cy.withCtx((ctx) => {
      return ctx.actions.file.moveFileInProject('src/button.spec.js', 'src/button.cy.js')
    }).then(() => {
      cy.get('[data-cy="moved"]').contains('src/button.spec.js')
    })

    cy.withCtx((ctx) => {
      return ctx.actions.file.moveFileInProject('src/input-spec.tsx', 'src/input.cy.tsx')
    }).then(() => {
      cy.get('[data-cy="moved"]').contains('src/input-spec.tsx')
    })

    cy.get('button').contains('I have moved my component specs')
  })
})

describe('component testing migration', () => {
  // TODO: toApp emitter not working in Cypress in Cypress.
  it.skip('live update migration UI as user moves files', () => {
    cy.scaffoldProject('migration-component-testing-customized')
    cy.openProject('migration-component-testing-customized')
    cy.visitLaunchpad()
    cy.waitForWizard()

    // need to move your specs before this button shows
    cy.get('button').contains('I have moved my component specs').should('not.exist')

    // two files to move, src/button.spec.js and src/input-spec.tsx.
    cy.withCtx((ctx) => {
      return ctx.actions.file.moveFileInProject('src/button.spec.js', 'src/button.cy.js')
    }).then(() => {
      cy.get('[data-cy="moved"]').contains('src/button.spec.js')
    })

    cy.withCtx((ctx) => {
      return ctx.actions.file.moveFileInProject('src/input-spec.tsx', 'src/input.cy.tsx')
    }).then(() => {
      cy.get('[data-cy="moved"]').contains('src/input-spec.tsx')
    })

    cy.get('button').contains('I have moved my component specs')
  })
})

describe('Migration', { viewportWidth: 1200 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('migration')
    cy.openProject('migration')
  })

  it('renames support file', () => {
    cy.visitLaunchpad()
    cy.waitForWizard()

    // rename specs
    cy.get('button').contains('Rename these specs for me').click()

    // skip component for now
    cy.findByText(`I'll do this later`).click()

    cy.findByText(`Rename the support file for me`).click()

    cy.withCtx(async (ctx) => {
      expect(
        await ctx.actions.file.checkIfFileExists(ctx.path.join('cypress', 'support', 'e2e.js')),
      ).not.to.be.null
    })
  })

  describe('Configuration', () => {
    beforeEach(() => {
      cy.visitLaunchpad()
      cy.waitForWizard()

      // rename specs
      cy.get('button').contains('Rename these specs for me').click()

      cy.findByText(`I'll do this later`).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
    })

    it('should create the cypress.config.js file and delete old config', () => {
      cy.withCtx(async (ctx) => {
        const configStats = await ctx.actions.file.checkIfFileExists('cypress.config.js')

        expect(configStats).to.not.be.null.and.not.be.undefined

        const oldConfigStats = await ctx.actions.file.checkIfFileExists('cypress.json')

        expect(oldConfigStats).to.be.null
      })
    })

    it('should create a valid js file', () => {
      cy.withCtx(async (ctx) => {
        const configPath = ctx.path.join(ctx.lifecycleManager.projectRoot, 'cypress.config.js')

        const isValidJsFile = ctx.file.isValidJsFile(configPath)

        expect(isValidJsFile).to.be.true
      })
    })
  })

  describe('File Renames', () => {
    it('should move files to correct location', () => {
      cy.visitLaunchpad()
      cy.waitForWizard()

      ;[
        'app_spec.js',
        'blog-post-spec.ts',
        'homeSpec.js',
        'someDir/someFile.js',
        'bar.spec.js',
        'company.js',
        'sign-up.js',
        'spectacleBrowser.ts',
      ].forEach((spec) => {
        // before
        cy.contains(`cypress/integration/${spec}`)
        // after
        cy.contains(`cypress/e2e/${spec}`)
      })

      // do the rename!
      cy.get('button').contains('Rename these specs for me').click()

      // ensure file has been moved
      cy.wait(100)

      cy.withCtx((ctx) => {
        [
          'app_spec.js',
          'blog-post-spec.ts',
          'homeSpec.js',
          'someDir/someFile.js',
          'bar.spec.js',
          'company.js',
          'sign-up.js',
          'spectacleBrowser.ts',
        ].forEach(async (spec) => {
          const stats = await ctx.actions.file.checkIfFileExists(ctx.path.join('cypress', 'e2e', spec))

          expect(stats).to.not.be.null
        })
      })
    })
  })

  describe('Full flow', () => {
    it('goes to each step', () => {
      cy.visitLaunchpad()
      cy.waitForWizard()
      cy.findByText(defaultMessages.migration.wizard.step1.button).click()
      cy.findByText(defaultMessages.migration.wizard.step2.button).click()
      cy.findByText(defaultMessages.migration.wizard.step3.button).click()
      cy.findByText(defaultMessages.migration.wizard.step4.button).click()
      cy.findByText(defaultMessages.migration.wizard.step5.button).click()
      cy.findByText('Welcome to Cypress!').should('be.visible')
    })
  })
})
