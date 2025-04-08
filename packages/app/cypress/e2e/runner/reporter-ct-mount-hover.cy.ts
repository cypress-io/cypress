import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const PROJECTS: {projectName: ProjectDirs[number], test: string}[] = [
  { projectName: 'angular-19', test: 'app.component' },
  { projectName: 'react-vite-ts-configured', test: 'App.cy' },
  { projectName: 'react18', test: 'App.cy' },
  { projectName: 'next-14', test: 'index.cy' },
  { projectName: 'vue3-vite-ts-configured', test: 'HelloWorld.cy' },
  { projectName: 'vue3-webpack-ts-configured', test: 'HelloWorld.cy' },
  { projectName: 'svelte-vite-configured', test: 'App.cy' },
]

// These are especially flaky on windows, skipping them there.
const describeSkipIfWindows = Cypress.platform === 'win32' ? describe.skip : describe

// TODO: Add these tests to another cy-in-cy framework test to reduce CI cost as these scaffolding is expensive
for (const { projectName, test } of PROJECTS) {
  // Flaky, especially on windows. Issue to improve these tests: https://github.com/cypress-io/cypress/issues/24579
  describeSkipIfWindows(`CT Mount ${projectName}`, { viewportWidth: 1500, defaultCommandTimeout: 30000 }, () => {
    beforeEach(() => {
      cy.scaffoldProject(projectName)
      cy.findBrowsers()
    }),
    it(`While hovering on Mount(), shows component on AUT for ${projectName}`, () => {
      if (projectName === 'react18') {
        cy.openProject(projectName, ['--config-file', 'cypress-vite-default.config.ts', '--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible()
        cy.contains(`${test}`).click()
        cy.waitForSpecToFinish(undefined)
        cy.get('.collapsible-header-inner:first').click().get('.command.command-name-mount > .command-wrapper').click().then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
            cy.get('[data-cy-root]').children().should('have.length.at.least', 1)
          })
        })
      } else {
        cy.openProject(projectName, ['--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible()
        cy.contains(`${test}`).click()
        cy.waitForSpecToFinish(undefined)

        cy.get('.command.command-name-mount > .command-wrapper').click().then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
            cy.get('[data-cy-root]').children().should('have.length.at.least', 1)
          })
        })
      }
    })
  })
}
