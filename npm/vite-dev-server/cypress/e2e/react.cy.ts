/// <reference path="../support/e2e.ts" />
import type { fixtureDirs } from '@tooling/system-tests'
import dedent from 'dedent'

type ProjectDirs = typeof fixtureDirs

const VITE_REACT: ProjectDirs[number][] = ['vite4.5.5-react', 'vite5.4.10-react', 'vite6.0.0-react']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectDirs[number][] = []

for (const project of VITE_REACT) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project, ['--config-file', 'cypress-vite.config.ts', '--component'])
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('App.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 2)
    })

    it('MissingReact: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('MissingReact.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReact.jsx`,
        `import React from 'react';
        ${await ctx.file.readFileInProject('src/MissingReact.jsx')}`)
      })

      cy.get('.passed > .num').should('contain', 1)
    })

    it('MissingReactInSpec: should fail, rerun, succeed', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('MissingReactInSpec.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.get('.test-err-code-frame').should('be.visible')
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(`src/MissingReactInSpec.cy.jsx`,
          await ctx.file.readFileInProject('src/App.cy.jsx'))
      })

      cy.get('.passed > .num').should('contain', 2)
    })

    it('AppCompilationError: should fail with uncaught exception error', () => {
      cy.on('uncaught:exception', () => {
        // Ignore the uncaught exception in the AUT
        return false
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      cy.contains('AppCompilationError.cy.jsx').click()
      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.contains('An uncaught error was detected outside of a test')
      cy.contains('The following error originated from your test code, not from Cypress.')

      // Correct the problem
      cy.withCtx(async (ctx) => {
        await ctx.actions.file.writeFileInProject(
          `src/AppCompilationError.cy.jsx`,
          await ctx.file.readFileInProject('src/App.cy.jsx'),
        )
      })

      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 2)

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

      cy.waitForSpecToFinish()
      cy.get('.failed > .num').should('contain', 1)
      cy.contains('An uncaught error was detected outside of a test')
      cy.contains('The following error originated from your test code, not from Cypress.')
    })
  })
}
