import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const PROJECTS: {projectName: ProjectDirs[number], bundler: 'vite' | 'webpack'}[] = [
  { projectName: 'experimental-JIT/vite', bundler: 'vite' },
  { projectName: 'experimental-JIT/webpack', bundler: 'webpack' },
]

for (const { projectName, bundler } of PROJECTS) {
  describe(`CT experimentalJustInTimeCompile: ${bundler}`, { viewportWidth: 1500, defaultCommandTimeout: 30000 }, () => {
    const visitComponentSpecAndVerifyPass = (specNumber: number) => {
      cy.contains(`Component-${specNumber}.cy.jsx`).click()
      cy.waitForSpecToFinish(undefined)
      cy.get('[aria-label="Stats"] .passed > .num').should('contain', '1')
      cy.get('[aria-label="Stats"] .failed > .num').should('contain', '--')
    }

    beforeEach(() => {
      cy.scaffoldProject(projectName)
      cy.findBrowsers()
    }),

    it(`can run multiple CT tests without interruption`, () => {
      cy.openProject(projectName, ['--component'])
      cy.startAppServer('component')
      cy.visitApp()
      cy.specsPageIsVisible()
      visitComponentSpecAndVerifyPass(2)
      cy.get('[data-cy="sidebar-link-specs-page"]').click()
      visitComponentSpecAndVerifyPass(1)
      cy.get('[data-cy="sidebar-link-specs-page"]').click()
      visitComponentSpecAndVerifyPass(3)
    })
  })
}
