/// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'

type ProjectDirs = typeof e2eProjectDirs

const WEBPACK_REACT: ProjectDirs[number][] = ['webpack4_wds3-react', 'webpack4_wds4-react', 'webpack5_wds3-react', 'webpack5_wds4-react']

describe('vanilla-react.cy.ts', () => {
  for (const project of WEBPACK_REACT) {
    describe(project, () => {
      beforeEach(() => {
        cy.scaffoldProject(project)
        cy.openProject(project)
        cy.startAppServer('component')
      })

      it('should mount a passing test', () => {
        cy.visitApp()
        cy.contains('App.cy.jsx').click()
        cy.get('.passed > .num').should('contain', 1)
      })
    })
  }
})
