import type { DraggablePanel } from '../../src/runner/useRunnerStyle'

const testingTypes = ['component', 'e2e'] as const

const dragHandleToClientX = (panel: DraggablePanel, x: number) => {
  cy.get(`[data-cy="${panel}ResizeHandle"]`).trigger('mousedown', { eventConstructor: 'MouseEvent' })
  .trigger('mousemove', { clientX: x })
  .trigger('mouseup', { eventConstructor: 'MouseEvent' })
}

function startAtSpecsPage (testingType: typeof testingTypes[number]) {
  cy.scaffoldProject('cypress-in-cypress')
  cy.findBrowsers()
  cy.openProject('cypress-in-cypress')
  cy.startAppServer(testingType)
  cy.visitApp()
}

// For Cypress-in-Cypress tests that do not vary based on testing type
describe('Cypress in Cypress', { viewportWidth: 1500, defaultCommandTimeout: 10000 }, () => {
  testingTypes.forEach((testingType) => {
    it(`handles automation disconnects in ${testingType}`, () => {
      startAtSpecsPage(testingType)

      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible')

      cy.withCtx((ctx) => {
        ctx.coreData.servers.appSocketServer?.emit('automation:disconnected')
      })

      cy.contains('h3', 'The Cypress extension has disconnected')

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('button', 'Reload the browser').click()

      cy.withCtx((ctx) => {
        expect(ctx.actions.project.launchProject).to.have.been.called
      })

      cy.percySnapshot()
    })

    it(`handles automation missing in ${testingType}`, () => {
      let connectedCallback: any

      startAtSpecsPage(testingType)

      cy.window().then((win) => {
        if (!win.ws) {
          throw new Error('"window.ws" is expected to be available')
        }

        const originalEmit: Function = win.ws.emit
        const stub = cy.stub(win.ws as any, 'emit')

        stub.callsFake((...args) => {
          if (args[0] === 'is:automation:client:connected') {
            connectedCallback = args[2]
          }

          originalEmit.call(win.ws, ...args)
        })
      })

      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible').then(() => {
        connectedCallback(false)
      })

      cy.contains('h3', 'The Cypress extension is missing')

      cy.percySnapshot()

      cy.get('[data-cy="select-browser"]').click()

      cy.percySnapshot()

      cy.withCtx((ctx, { sinon }) => {
        sinon.stub(ctx.actions.project, 'launchProject').resolves()
      })

      cy.contains('li', 'Electron').click()

      cy.withCtx((ctx) => {
        expect(ctx.coreData.activeBrowser?.displayName).eq('Electron')
        expect(ctx.actions.project.launchProject).to.have.been.called
      })
    })

    it(`scales the AUT correctly in ${testingType}`, () => {
      startAtSpecsPage(testingType)
      cy.get('[data-cy="spec-item"]').first().click()
      // Let runner stabilize
      cy.get('#unified-reporter').should('be.visible')
      const dragPositions = [1000, 1090, 900, 600]
      const testingTypeExpectedScales = {
        component: ['93%', '75%'],
        e2e: ['46%', '37%', '56%', '85%'],
        componentShortViewport: '61%',
        e2eShortViewport: '46%',
      }

      dragPositions.forEach((position, index) => {
        dragHandleToClientX('panel2', position)
        const expectedScale = testingTypeExpectedScales[testingType][index]

        if (expectedScale) {
          cy.contains(expectedScale).should('be.visible')
        } else {
          cy.contains('%)').should('not.exist')
        }

        cy.percySnapshot(`panel 2 at ${ position } px`)
      })

      cy.viewport(1500, 1300)
      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs').click()
      cy.contains('%)').should('not.exist')
      cy.percySnapshot('tall viewport')

      cy.viewport(1500, 400)
      cy.contains(testingTypeExpectedScales[`${ testingType }ShortViewport`]).should('exist')
      cy.percySnapshot('short viewport')
    })
  })
})
