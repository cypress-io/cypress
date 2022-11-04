import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const PROJECTS: {projectName: ProjectDirs[number], test: string}[] = [
  { projectName: 'angular-14', test: 'app.component' },
  { projectName: 'vueclivue2-configured', test: 'HelloWorld.cy' },
  { projectName: 'react-vite-ts-configured', test: 'App.cy' },
  { projectName: 'react18', test: 'App.cy' },
  { projectName: 'create-react-app-configured', test: 'App.cy' },
  { projectName: 'vueclivue3-configured', test: 'HelloWorld.cy' },
  { projectName: 'nuxtjs-vue2-configured', test: 'Tutorial.cy' },
]

// TODO: Add these tests to another cy-in-cy framework test to reduce CI cost as these scaffolding is expensive
for (const { projectName, test } of PROJECTS) {
  describe(`CT Mount ${projectName}`, { viewportWidth: 1500, defaultCommandTimeout: 30000 }, () => {
    beforeEach(() => {
      cy.scaffoldProject(projectName)
      cy.findBrowsers()
    }),
    it(`While hovering on Mount(), shows component on AUT for ${projectName}`, () => {
      if (`${projectName}` === 'react18') {
        cy.openProject(projectName, ['--config-file', 'cypress-vite.config.ts'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.contains(`${test}`).click()
        cy.waitForSpecToFinish()
        cy.get('.collapsible-header-inner:first').click().get('.command.command-name-mount > .command-wrapper').click().then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
            cy.get('[data-cy-root]').children().should('have.length.at.least', 1)
          })
        })
      } else {
        cy.openProject(projectName)
        cy.startAppServer('component')
        cy.visitApp()
        cy.contains(`${test}`).click()
        cy.waitForSpecToFinish()
        cy.get('.command.command-name-mount > .command-wrapper').click().then(() => {
          if (`${projectName}` === 'angular-14') {
            cy.get('iframe.aut-iframe').its('0.contentDocument.body').children().should('have.length.at.least', 2)
          } else {
            cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
              cy.get('[data-cy-root]').children().should('have.length.at.least', 1)
            })
          }
        })
      }
    })
  })
}
