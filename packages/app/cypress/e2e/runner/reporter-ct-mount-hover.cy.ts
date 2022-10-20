import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs
//,  'react18'[not working], 'create-react-app-configured'[it uses the test that is inside the system-tests], 'react-vite-ts-configured', 'cra-5'

const REACT_PROJECTS: ProjectDirs[number][] = ['vueclivue2-configured']

// 'vuecli4-vue2', 'nuxtjs-vue2-configured'- not working, 'angular-15', 'vuecli5-vue3'

// const OTHER_PROJECTS: ProjectDirs[number][] = ['vueclivue2-configured']

// const ONLY_PROJECTS: ProjectDirs[number][] = []

for (const project of REACT_PROJECTS) {
  // if (ONLY_PROJECTS.length && !ONLY_PROJECTS.includes(project)) {
  //   continue
  // }

  describe(`CT Mount ${project}`, { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
    context('While hovering on Mount(), component is visible on AUT', () => {
      beforeEach(() => {
        cy.scaffoldProject(`${project}`)
        cy.findBrowsers()
      }),
      it(`shows component on AUT for ${project}`, () => {
        cy.openProject(project, ['--config', 'viewportWidth=333,viewportHeight=333'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.contains('Tutorial.cy').click()
        cy.get('.command.command-name-mount > .command-wrapper').trigger('mouseover').then(() => {
          cy.get('iframe.aut-iframe').its('0.contentDocument.body').then(cy.wrap).within(() => {
            cy.get('[data-cy-root]').invoke('children').should('have.length.above', 0)
          })
        })
      })
    })
  })
}
