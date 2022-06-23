/// <reference path="../support/e2e.ts" />
import type { ProjectFixtureDir } from '@tooling/system-tests/lib/fixtureDirs'

const PROJECTS: ProjectFixtureDir[] = ['vuecli4-vue2', 'vuecli4-vue3', 'vuecli5-vue3']

// Add to this list to focus on a particular permutation
const ONLY_PROJECTS: ProjectFixtureDir[] = []

for (const project of PROJECTS) {
  if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
    continue
  }

  describe(`Working with ${project}`, () => {
    beforeEach(() => {
      cy.scaffoldProject(project)
      cy.openProject(project)
      cy.startAppServer('component')
    })

    it('should mount a passing test', () => {
      cy.visitApp()
      cy.contains('HelloWorld.cy.js').click()
      cy.waitForSpecToFinish()
      cy.get('.passed > .num').should('contain', 1)
      cy.get('.commands-container').within(() => {
        cy.contains('mount')
        cy.contains('<HelloWorld ... />')
      })
    })
  })
}
