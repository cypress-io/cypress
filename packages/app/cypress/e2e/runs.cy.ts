describe('App: Runs', { viewportWidth: 1200 }, () => {
  describe('refetching', () => {
    let obj: {toCall?: Function} = {}

    beforeEach(() => {
      cy.scaffoldProject('component-tests')
      cy.openProject('component-tests')
      cy.startAppServer('component')
      cy.loginUser()
      cy.remoteGraphQLIntercept((obj) => {
        if (obj.result.data?.cloudProjectBySlug?.runs?.nodes.length) {
          obj.result.data.cloudProjectBySlug.runs.nodes.map((run) => {
            run.status = 'RUNNING'
          })

          obj.result.data.cloudProjectBySlug.runs.nodes = obj.result.data.cloudProjectBySlug.runs.nodes.slice(0, 3)
        }

        return obj.result
      })

      cy.visitApp('/runs', {
        onBeforeLoad (win) {
          const setTimeout = win.setTimeout

          // @ts-expect-error
          win.setTimeout = function (fn: () => void, time: number) {
            if (fn.name === 'fetchNewerRuns') {
              obj.toCall = fn
            } else {
              setTimeout(fn, time)
            }
          }
        },
      })
    })

    // https://github.com/cypress-io/cypress/issues/24575

    const RUNNING_COUNT = 3

    it('should re-query for executing runs', { defaultCommandTimeout: 7500 }, () => {
      cy.get('[data-cy="run-card-icon-RUNNING"]').should('have.length', RUNNING_COUNT).should('be.visible')

      cy.remoteGraphQLIntercept(async (obj) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (obj.result.data?.cloudNode?.newerRuns?.nodes) {
          obj.result.data.cloudNode.newerRuns.nodes = []
        }

        if (obj.result.data?.cloudNodesByIds) {
          obj.result.data?.cloudNodesByIds.map((node) => {
            node.status = 'RUNNING'
          })

          obj.result.data.cloudNodesByIds[0].status = 'PASSED'
        }

        return obj.result
      })

      function completeNext (passed) {
        cy.wrap(obj).invoke('toCall').then(() => {
          cy.wait(3500)
          cy.get('[data-cy="run-card-icon-PASSED"]').should('have.length', passed).should('be.visible')
          if (passed < RUNNING_COUNT) {
            completeNext(passed + 1)
          }
        })
      }

      completeNext(1)
    })
  })
})
