import { getPathForPlatform } from '../../../src/paths'

describe('plugin events', () => {
  it('supports "before:run" event', () => {
    let projectRoot: string

    cy.scaffoldProject('plugin-run-events')
    .then((projectPath) => {
      projectRoot = projectPath

      cy.openProject('plugin-run-events')
      cy.startAppServer('e2e')
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.get('[data-cy-row="run_events_spec_1.cy.js"]').eq(1).click()
      cy.waitForSpecToFinish({
        passCount: 1,
      })

      cy.readFile(`${projectRoot}/beforeRun.json`)
      .then((details) => {
        expect(details).to.have.property('config')
        expect(details).to.have.property('cypressVersion')
        expect(details).to.have.property('system')
      })
    })
  })

  it('supports "before:spec" event', () => {
    let projectRoot: string

    cy.scaffoldProject('plugin-run-events')
    .then((projectPath) => {
      projectRoot = projectPath

      cy.openProject('plugin-run-events')
      cy.startAppServer('e2e')
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.get('[data-cy-row="run_events_spec_1.cy.js"]').eq(1).click()
      cy.waitForSpecToFinish({
        passCount: 1,
      })

      cy.readFile(`${projectRoot}/beforeSpec.json`)
      .then((spec) => {
        expect(spec).to.deep.contains({
          baseName: 'run_events_spec_1.cy.js',
          fileExtension: '.js',
          fileName: 'run_events_spec_1',
          name: 'run_events_spec_1.cy.js',
          relative: getPathForPlatform('cypress/e2e/run_events_spec_1.cy.js'),
          specFileExtension: '.cy.js',
          specType: 'integration',
        })
      })

      cy.get('body').type('f')
      cy.get('div[title="run_events_spec_2.cy.js"]').click()
      cy.waitForSpecToFinish({
        passCount: 1,
      })

      cy.readFile(`${projectRoot}/beforeSpec.json`)
      .then((spec) => {
        expect(spec).to.deep.contains({
          baseName: 'run_events_spec_2.cy.js',
          fileExtension: '.js',
          fileName: 'run_events_spec_2',
          name: 'run_events_spec_2.cy.js',
          relative: getPathForPlatform('cypress/e2e/run_events_spec_2.cy.js'),
          specFileExtension: '.cy.js',
          specType: 'integration',
        })
      })
    })
  })
})
