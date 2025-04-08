/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const NEXT_PROJECTS: ProjectFixtureDir[] = ['next-14']
// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of NEXT_PROJECTS) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project, ['--component'])
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('index.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.contains('index.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('pages', 'index.js')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.waitForSpecToFinish({ failCount: 1 })
      cy.get('.test-err-code-frame').should('be.visible')

      cy.withCtx(async (ctx) => {
        const indexTestPath = ctx.path.join('pages', 'index.cy.js')

        await ctx.actions.file.writeFileInProject(
          indexTestPath,
          (await ctx.file.readFileInProject(indexTestPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should show compilation errors on src changes', () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.contains('index.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      // Create compilation error
      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('pages', 'index.js')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('export', 'expart'),
        )
      })

      // The test should fail and the stack trace should appear in the command log
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('The following error originated from your test code, not from Cypress.').should('exist')
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23417
    it('should detect new spec', { retries: 15 }, () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.withCtx(async (ctx) => {
        const newTestPath = ctx.path.join('pages', 'New.cy.js')
        const indexTestPath = ctx.path.join('pages', 'index.cy.js')

        await ctx.actions.file.writeFileInProject(
          newTestPath,
          await ctx.file.readFileInProject(indexTestPath),
        )
      })

      cy.contains('New.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23417
    it('should allow import of global styles in support file', { retries: 15 }, () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('styles.cy.js').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })
  })
}

const NEXT_PROJECTS_TSCONFIG_TAILWIND: ProjectFixtureDir[] = ['next-14-tsconfig-tailwind', 'next-15-tsconfig-tailwind']

for (const project of NEXT_PROJECTS_TSCONFIG_TAILWIND) {
  // Since next-tsconfig-tailwind does not use the fixture directory we need to write our own test suite
  // We want to specifically test typescript files with next as there have been known problems with
  // module: bundler and cypress compatibility
  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project, ['--component'])
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('page.cy.tsx').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should live-reload on src changes', () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.contains('page.cy.tsx').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('app', 'page.tsx')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.waitForSpecToFinish({ failCount: 1 })
      if (project !== 'next-15-tsconfig-tailwind') {
        // code frames not fully working with next 15
        cy.get('.test-err-code-frame').should('be.visible')
      }

      cy.withCtx(async (ctx) => {
        const indexTestPath = ctx.path.join('app', 'page.cy.tsx')

        await ctx.actions.file.writeFileInProject(
          indexTestPath,
          (await ctx.file.readFileInProject(indexTestPath)).replace('Welcome to', 'Hello from'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('should show compilation errors on src changes', () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.contains('page.cy.tsx').click()
      cy.waitForSpecToFinish({ passCount: 1 })

      // Create compilation error
      cy.withCtx(async (ctx) => {
        const indexPath = ctx.path.join('app', 'page.tsx')

        await ctx.actions.file.writeFileInProject(
          indexPath,
          (await ctx.file.readFileInProject(indexPath)).replace('export', 'expart'),
        )
      })

      // The test should fail and the stack trace should appear in the command log
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('The following error originated from your test code, not from Cypress.').should('exist')
    })

    it('should detect new spec', { retries: 15 }, () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.withCtx(async (ctx) => {
        const newTestPath = ctx.path.join('app', 'New.cy.tsx')
        const indexTestPath = ctx.path.join('app', 'page.cy.tsx')

        await ctx.actions.file.writeFileInProject(
          newTestPath,
          await ctx.file.readFileInProject(indexTestPath),
        )
      })

      cy.contains('New.cy.tsx').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })

    // Make sure tailwind styles are appearing in the test.
    it('should allow import of global styles in support file', { retries: 15 }, () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('page-styles.cy.tsx').click()
      cy.waitForSpecToFinish({ passCount: 1 })
    })
  })
}
