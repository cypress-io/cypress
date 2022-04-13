// <reference types="cypress" />
/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const PROJECTS: ProjectFixtureDir[] = ['nuxtjs2', 'vuecli4-vue2']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of PROJECTS) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  // TODO: This will work once `cypress/vue2` is bundled in the binary
  // Since Nuxt.js 2 is based on `vue@2`.
  describe.skip(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project)
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.contains('Tutorial.cy.js').click()
      cy.get('.passed > .num').should('contain', 1)
    })
  })
}
