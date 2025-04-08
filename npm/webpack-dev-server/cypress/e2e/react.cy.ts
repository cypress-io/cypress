/// <reference path="../support/e2e.ts" />
import type { fixtureDirs } from '@tooling/system-tests'
import dedent from 'dedent'

type ProjectDirs = typeof fixtureDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds4-react', 'webpack5_wds4-react', 'webpack5_wds5-react']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectDirs[number][] = []

for (const project of WEBPACK_REACT) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project, ['--config-file', 'cypress-webpack.config.ts', '--component'])
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('App.cy.jsx').click()
      cy.waitForSpecToFinish({ passCount: 2 })
    })

    it('MissingReact: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('MissingReact.cy.jsx').click()
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.get('.test-err-code-frame').should('be.visible')
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReact.jsx`,
        `import React from 'react';
        ${await ctx.file.readFileInProject('src/MissingReact.jsx')}`)
      })

      cy.waitForSpecToFinish({ passCount: 1 })
    })

    it('MissingReactInSpec: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('MissingReactInSpec.cy.jsx').click()
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.get('.test-err-code-frame').should('be.visible')
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReactInSpec.cy.jsx`,
          await ctx.file.readFileInProject('src/App.cy.jsx'))
      })

      cy.waitForSpecToFinish({ passCount: 2 })
    })

    it('AppCompilationError: should fail with uncaught exception error', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('AppCompilationError.cy.jsx').click()
      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('An uncaught error was detected outside of a test')
      cy.contains('The following error originated from your test code, not from Cypress.')

      // Correct the problem
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          `src/AppCompilationError.cy.jsx`,
          await ctx.file.readFileInProject('src/App.cy.jsx'),
        )
      })

      cy.waitForSpecToFinish({ passCount: 2 })

      const appCompilationErrorSpec = dedent`
        import React from 'react'
        import { mount } from 'cypress/react'
        import { App } from './App'

        it('renders hello world', () => {
          mount(<App />)
          cy.get('h1').contains('Hello World')
        }
        })
      `

      // Cause the problem again
      cy.withCtx(async (ctx, o) => {
        await ctx.actions.file.writeFileInProject(
          `src/AppCompilationError.cy.jsx`,
          o.appCompilationErrorSpec,
        )
      }, { appCompilationErrorSpec })

      cy.waitForSpecToFinish({ failCount: 1 })
      cy.contains('An uncaught error was detected outside of a test')
      cy.contains('The following error originated from your test code, not from Cypress.')
    })

    // https://cypress-io.atlassian.net/browse/UNIFY-1697
    it('filters missing spec files from loader during pre-compilation', () => {
      cy.visitApp()
      cy.specsPageIsVisible()

      // 1. assert spec executes successfully
      cy.contains('App.cy.jsx').click()
      cy.waitForSpecToFinish({ passCount: 2 })

      // 2. remove file from file system
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.removeFileInProject(`src/App.cy.jsx`)
      })

      // 3. assert redirect back to #/specs with alert presented
      cy.contains('[data-cy="alert"]', 'Spec not found')

      // 4. recreate spec, with same name as removed spec
      cy.findByTestId('new-spec-button').click()
      cy.findByRole('button', { name: 'Create new spec' }).should('be.visible').click()

      cy.findByRole('dialog').within(() => {
        cy.get('input').clear().type('src/App.cy.jsx')
        cy.contains('button', 'Create spec').click()
      })

      cy.findByRole('dialog').within(() => {
        cy.contains('button', 'Okay, run the spec').click()
      })

      // 5. assert recreated spec executes successfully
      cy.waitForSpecToFinish({ passCount: 1 })
    })
  })
}
