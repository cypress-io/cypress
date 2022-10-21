import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

const PROJECTS: {projectName: ProjectDirs[number], test: string}[] = [
  { projectName: 'angular-15', test: 'app.component' },
  { projectName: 'react-vite-ts-configured', test: 'App.cy' },
  { projectName: 'react18', test: 'App.cy' },
  { projectName: 'create-react-app-configured', test: 'App.cy' },
  { projectName: 'vueclivue3-configured', test: 'HelloWorld.cy' },
  { projectName: 'vuecli4-vue2', test: 'HelloWorld.cy' },
  { projectName: 'vueclivue2-configured', test: 'HelloWorld.cy' },
  { projectName: 'nuxtjs-vue2-configured', test: 'Tutorial.cy' },
]

for (const { projectName, test } of PROJECTS) {
  describe(`CT Mount ${projectName}`, { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
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
        cy.get('.collapsible-header-inner:first').click().get('.command.command-name-mount > .command-wrapper').realHover().then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
          })
        })
      } else {
        cy.openProject(projectName)
        cy.startAppServer('component')
        cy.visitApp()
        cy.contains(`${test}`).click()
        cy.waitForSpecToFinish()
        cy.get('.command.command-name-mount > .command-wrapper').realHover().then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
          })
        })
      }
    })
  })
}
