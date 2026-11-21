import { CY_IN_CY_SIMULATE_RUN_MODE } from '@packages/types'
import type { ReceivedCypressOptions } from '@packages/types'

describe('Cypress In Cypress - run mode', { viewportWidth: 1200 }, () => {
  it('e2e run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.waitForSpecToFinish()

    cy.findByTestId('aut-url').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.reporter().find('[aria-label="Stats"] .passed .num', { timeout: 10000 }).should('have.text', '1')

    // confirm expected content is rendered
    cy.contains('1000x660').should('be.visible')
    cy.contains('71%').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')
    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport-size').should('be.visible')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('component testing run mode spec runner header is correct', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress', ['--component'])
    cy.startAppServer('component')
    cy.visitApp(`/specs/runner?file=src/TestComponent.spec.jsx&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.waitForSpecToFinish()
    cy.findByTestId('aut-url').contains('URL navigation disabled in component testing').should('be.visible')
    cy.findByTestId('playground-activator').should('not.exist')

    cy.reporter().find('[aria-label="Stats"] .passed .num', { timeout: 10000 }).should('have.text', '1')

    // confirm expected content is rendered
    cy.contains('500x500').should('be.visible')
    cy.contains('Chrome 1').should('be.visible')

    // confirm no interactions are implemented
    cy.findByTestId('viewport-size').should('be.visible')
    cy.contains('Chrome 1').click()
    cy.contains('Firefox').should('not.exist')

    // cy.percySnapshot() // TODO: restore when Percy CSS is fixed. See https://github.com/cypress-io/cypress/issues/23435
  })

  it('hides the command log when hideCommandLog is set in run mode', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.withCtx(async (ctx, o) => {
      const config = ctx._apis.projectApi.getConfig()

      o.sinon.stub(ctx._apis.projectApi, 'getConfig').returns({
        ...config,
        hideCommandLog: true,
      } as ReceivedCypressOptions)
    })

    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('be.visible')
    cy.get('#reporter-frame').should('not.exist')
    cy.findByTestId('specs-list-panel').should('not.be.visible')
    cy.findByTestId('reporter-panel').should('not.be.visible')
    cy.findByTestId('sidebar').should('not.exist')
  })

  it('hides the runner when hideRunnerUi is set in run mode', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()
    cy.withCtx(async (ctx, o) => {
      const config = ctx._apis.projectApi.getConfig()

      o.sinon.stub(ctx._apis.projectApi, 'getConfig').returns({
        ...config,
        hideCommandLog: true,
        hideRunnerUi: true,
      } as ReceivedCypressOptions)
    })

    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`)

    cy.contains('http://localhost:4455/cypress/e2e/dom-content.html').should('not.exist')
    cy.get('#reporter-frame').should('not.exist')
    cy.findByTestId('specs-list-panel').should('not.be.visible')
    cy.findByTestId('reporter-panel').should('not.be.visible')
    cy.findByTestId('sidebar').should('not.exist')
    cy.get('#spec-runner-header').should('not.exist')
  })

  // https://github.com/cypress-io/cypress/issues/35236
  it('does not rerun the spec when the GraphQL WebSocket reconnects', () => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.findBrowsers()
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()

    interface TrackedSocket {
      socket: WebSocket
      // subscription id => operation name, from the `subscribe` messages sent
      operations: Map<string, string>
      // names of the operations the server has sent a value for
      answered: Set<string>
    }

    const graphqlSockets: TrackedSocket[] = []

    const readMessage = (data: unknown): { id?: string, type?: string, payload?: { query?: string } } => {
      return typeof data === 'string' ? JSON.parse(data) : {}
    }

    cy.visitApp(`/specs/runner?file=cypress/e2e/dom-content.spec.js&${CY_IN_CY_SIMULATE_RUN_MODE}`, {
      onBeforeLoad (win) {
        const NativeWebSocket = win.WebSocket

        win.WebSocket = class extends NativeWebSocket {
          constructor (url: string | URL, protocols?: string | string[]) {
            super(url, protocols)

            if (!String(url).endsWith('/__socket-graphql')) {
              return
            }

            const tracked: TrackedSocket = { socket: this, operations: new Map(), answered: new Set() }

            graphqlSockets.push(tracked)

            const send = this.send.bind(this)

            this.send = (data) => {
              const { id, type, payload } = readMessage(data)
              const operationName = payload?.query?.match(/subscription (\w+)/)?.[1]

              if (id && type === 'subscribe' && operationName) {
                tracked.operations.set(id, operationName)
              }

              send(data)
            }

            this.addEventListener('message', (event) => {
              const { id, type } = readMessage(event.data)
              const operationName = id && tracked.operations.get(id)

              if (operationName && (type === 'next' || type === 'error')) {
                tracked.answered.add(operationName)
              }
            })
          }
        }
      },
    })

    cy.waitForSpecToFinish({ passCount: 1 })

    // Running the spec again always tears the current run down first
    cy.window().then((win) => {
      cy.spy(win.getEventManager(), 'teardown').as('teardown')
    })

    // Close the socket the way a dropped connection would, so graphql-ws
    // opens a new one and subscribes again
    cy.then(() => {
      const openSockets = graphqlSockets.filter(({ socket }) => socket.readyState === WebSocket.OPEN)

      expect(openSockets).to.have.length.greaterThan(0)
      openSockets.forEach(({ socket }) => socket.close(1000, 'simulated drop'))

      return openSockets
    }).then((closedSockets) => {
      const answeredBeforeDrop = new Set(closedSockets.flatMap(({ answered }) => [...answered]))

      expect(answeredBeforeDrop.size).to.be.greaterThan(0)

      // A rerun would start as soon as the server sends the resubscribed
      // operations their current values, so wait for all of them
      cy.wrap(graphqlSockets, { timeout: 10000 }).should((sockets) => {
        const reconnected = sockets.filter((tracked) => {
          return !closedSockets.includes(tracked) &&
            [...answeredBeforeDrop].every((operationName) => tracked.answered.has(operationName))
        })

        expect(reconnected).to.have.length.greaterThan(0)
      })
    })

    cy.get('@teardown').should('not.have.been.called')
    cy.reporter().find('[aria-label="Stats"] .passed .num').should('have.text', '1')
  })
})
