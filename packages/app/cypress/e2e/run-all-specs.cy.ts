import { RUN_ALL_SPECS_KEY } from '@packages/types/src'
import { getPathForPlatform } from '../../src/paths'

describe('run-all-specs', () => {
  const ALL_SPECS = {
    spec1: { relative: getPathForPlatform('cypress/e2e/folder-a/spec-a.cy.js'), name: 'runs folder-a/spec-a' },
    spec2: { relative: getPathForPlatform('cypress/e2e/folder-a/spec-b.cy.js'), name: 'runs folder-a/spec-b' },
    spec3: { relative: getPathForPlatform('cypress/e2e/folder-b/spec-a.cy.js'), name: 'runs folder-b/spec-a' },
    spec4: { relative: getPathForPlatform('cypress/e2e/folder-b/spec-b.cy.js'), name: 'runs folder-b/spec-b' },
    spec5: { relative: getPathForPlatform('folder-c/spec-a.cy.js'), name: 'runs folder-c/spec-a' },
    spec6: { relative: getPathForPlatform('folder-c/spec-b.cy.js'), name: 'runs folder-c/spec-b' },
  }

  const clickRunAllSpecs = (directory: string) => {
    const platformDir = getPathForPlatform(directory)

    if (directory === 'all') {
      return cy.findByTestId('run-all-specs-for-all').click()
    }

    const command = cy.get('[data-cy=spec-item-directory]').contains(platformDir)

    return command.realHover().then(() => {
      cy.get(`[data-cy="run-all-specs-for-${platformDir.replace('\\', '\\\\')}"]`).click({ force: true })
    })
  }

  it('can run all specs with filter and live-reloading', () => {
    cy.scaffoldProject('run-all-specs')
    cy.openProject('run-all-specs')
    cy.startAppServer()
    cy.visitApp()
    cy.specsPageIsVisible()

    // Spawns new browser so we need to stub this
    cy.withCtx((ctx, { sinon }) => {
      sinon.stub(ctx.actions.project, 'launchProject').resolves()
    })

    // Verify "Run All Specs" with sub-directory
    const subDirectorySpecs = [ALL_SPECS.spec1, ALL_SPECS.spec2]

    cy.findByTestId('sidebar-link-specs-page').click()

    clickRunAllSpecs('folder-a')

    cy.waitForSpecToFinish({ passCount: 2 })

    cy.withCtx((ctx, { specs, RUN_ALL_SPECS_KEY }) => {
      expect(ctx.actions.project.launchProject).to.have.been.calledWith('e2e', { shouldLaunchNewTab: true }, RUN_ALL_SPECS_KEY)
      expect(ctx.project.runAllSpecs).to.include.members(specs.map((spec) => spec.relative))
    }, { specs: subDirectorySpecs, RUN_ALL_SPECS_KEY })

    for (const spec of subDirectorySpecs) {
      cy.get('.runnable-title').contains(spec.name)
    }

    // Verify "Run All Specs" with filter
    const filteredSpecs = [ALL_SPECS.spec1, ALL_SPECS.spec3]

    cy.get('[data-cy=sidebar-link-specs-page]').click()

    cy.findByLabelText('Search specs').clear().type('spec-a')
    cy.get('[data-cy=spec-list-file]').contains('spec-b').should('not.exist')

    clickRunAllSpecs('cypress/e2e')

    cy.waitForSpecToFinish({ passCount: 2 })

    cy.withCtx((ctx, { specs }) => {
      expect(ctx.project.runAllSpecs).to.include.members(specs.map((spec) => spec.relative))
    }, { specs: filteredSpecs })

    for (const spec of filteredSpecs) {
      cy.get('.runnable-title').contains(spec.name)
    }

    // Verify "Run All Specs" with filter + folder
    const filteredWithSubDirectorySpecs = [ALL_SPECS.spec1]

    cy.get('[data-cy=sidebar-link-specs-page]').click()

    cy.findByLabelText('Search specs').clear().type('spec-a')
    cy.get('[data-cy=spec-list-file]').contains('spec-b').should('not.exist')

    clickRunAllSpecs('folder-a')

    cy.waitForSpecToFinish({ passCount: 1 })

    cy.withCtx((ctx, { specs }) => {
      expect(ctx.project.runAllSpecs).to.include.members(specs.map((spec) => spec.relative))
    }, { specs: filteredWithSubDirectorySpecs })

    for (const spec of filteredWithSubDirectorySpecs) {
      cy.get('.runnable-title').contains(spec.name)
    }

    // Verify "Run All Specs" live-reload
    cy.get('[data-cy=sidebar-link-specs-page]').click()
    cy.findByLabelText('Search specs').clear()
    cy.get('[data-cy=spec-list-file]').should('have.length', 6)

    clickRunAllSpecs('all')

    cy.withCtx((ctx, { specs }) => {
      expect(ctx.project.runAllSpecs).to.include.members(specs.map((spec) => spec.relative))
    }, { specs: Object.values(ALL_SPECS) })

    cy.waitForSpecToFinish({ passCount: 6 })

    for (const spec of Object.values(ALL_SPECS)) {
      cy.get('.runnable-title').contains(spec.name)
    }

    cy.withCtx(async (ctx, { spec }) => {
      const originalContent = await ctx.actions.file.readFileInProject(spec.relative)
      const newContent = originalContent.replace('expect(true)', 'expect(false)')

      expect(newContent).not.eq(originalContent)

      await ctx.actions.file.writeFileInProject(spec.relative, newContent)
    }, { spec: ALL_SPECS.spec1 })

    cy.waitForSpecToFinish({ passCount: 5, failCount: 1 })
  })
})
