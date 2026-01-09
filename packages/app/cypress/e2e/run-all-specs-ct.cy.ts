import { getPathForPlatform } from '../../src/paths'

describe('run-all-specs-ct', () => {
  const supportedBundlers: ('webpack' | 'vite')[] = ['vite', 'webpack']

  const clickRunAllSpecs = (directory: string) => {
    const platformDir = getPathForPlatform(directory)

    if (directory === 'all') {
      return cy.findByTestId('run-all-specs-for-all').click()
    }

    const command = cy.get('[data-cy=spec-item-directory]').contains(platformDir)

    return command.realHover().then(() => {
      cy.get(`[data-cy="run-all-specs-for-${platformDir.replace('\\', '\\\\')}"]`).click({ force: true })
    })
  }

  for (const bundler of supportedBundlers) {
    describe(`run-all-specs-ct-${bundler}`, () => {
      it('can run all specs with filter and live-reloadings', () => {
        cy.scaffoldProject(`run-all-specs-ct-${bundler}`)
        cy.openProject(`run-all-specs-ct-${bundler}`, ['--component'])
        cy.startAppServer('component')
        cy.visitApp()
        cy.specsPageIsVisible()

        // Spawns new browser so we need to stub this
        cy.withCtx((ctx, { sinon, ALL_SPECS }) => {
          sinon.stub(ctx.actions.project, 'launchProject').resolves()
        })

        clickRunAllSpecs('all')

        // in cy-in-cy only, runAllSpecs is always set AFTER initCypressTests is called inside the vite dev server, meaning that __RUN_ALL_SPECS__ on the window is out of date.
        // to hack around this, we reload the page to force the vite dev server to process the runAllSpecs again when the value is set properly.
        if (bundler === 'vite') {
          cy.get('.runnable-loading-title').should('not.be.visible')
          cy.reload()
        }

        cy.waitForSpecToFinish({ passCount: 6 })

        cy.get('[data-cy=sidebar-link-specs-page]').click()

        cy.findByLabelText('Search specs').clear()
        cy.findByLabelText('Search specs').type('folder-a/')
        cy.get('[data-cy=specs-list-row-file]').contains('folder-b').should('not.exist')
        cy.get('[data-cy=specs-list-row-file]').contains('folder-c').should('not.exist')

        clickRunAllSpecs('component/folder-a')

        // in cy-in-cy only, runAllSpecs is always set AFTER initCypressTests is called inside the vite dev server, meaning that __RUN_ALL_SPECS__ on the window is out of date.
        // to hack around this, we reload the page to force the vite dev server to process the runAllSpecs again when the value is set properly.
        if (bundler === 'vite') {
          cy.get('.runnable-loading-title').should('not.be.visible')
          cy.reload()
        }

        cy.waitForSpecToFinish({ passCount: 2 })

        cy.get('[data-cy=sidebar-link-specs-page]').click()

        cy.findByLabelText('Search specs').clear()
        cy.findByLabelText('Search specs').type('folder-b/')
        cy.get('[data-cy=specs-list-row-file]').contains('folder-a').should('not.exist')
        cy.get('[data-cy=specs-list-row-file]').contains('folder-c').should('exist')

        clickRunAllSpecs('component/folder-b')

        // in cy-in-cy only, runAllSpecs is always set AFTER initCypressTests is called inside the vite dev server, meaning that __RUN_ALL_SPECS__ on the window is out of date.
        // to hack around this, we reload the page to force the vite dev server to process the runAllSpecs again when the value is set properly.
        if (bundler === 'vite') {
          cy.get('.runnable-loading-title').should('not.be.visible')
          cy.reload()
        }

        cy.waitForSpecToFinish({ passCount: 3 })
      })
    })
  }
})
