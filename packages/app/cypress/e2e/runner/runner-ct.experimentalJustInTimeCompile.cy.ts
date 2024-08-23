import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const EXPERIMENTAL_JIT_DIR: ProjectDirs[number] = 'experimental-JIT'

const PROJECTS: {bundler: 'vite' | 'webpack'}[] = [
  { bundler: 'vite' },
  { bundler: 'webpack' },
]

for (const { bundler } of PROJECTS) {
  const PROJECT_NAME = `${EXPERIMENTAL_JIT_DIR}/${bundler}`

  describe(`CT experimentalJustInTimeCompile: ${bundler}`, { viewportWidth: 1500, defaultCommandTimeout: 30000 }, () => {
    const visitComponentSpecAndVerifyPass = (specNumber: number) => {
      cy.contains(`Component-${specNumber}.cy.jsx`).click()
      cy.waitForSpecToFinish(undefined)
      cy.get('[aria-label="Stats"] .passed > .num').should('contain', '1')
      cy.get('[aria-label="Stats"] .failed > .num').should('contain', '--')
    }

    beforeEach(() => {
      // @ts-expect-error
      cy.scaffoldProject(PROJECT_NAME)
      cy.findBrowsers()
    }),

    it(`can run multiple CT tests without interruption`, () => {
      // @ts-expect-error
      cy.openProject(PROJECT_NAME, ['--component'])
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
