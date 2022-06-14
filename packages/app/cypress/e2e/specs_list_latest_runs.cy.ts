function specRowSelector (specFileName: string) {
  return `[data-cy-row="${specFileName}"]`
}

function dotSelector (specFileName: string, dotNumber: 0 | 1 | 2 |'latest') {
  return `${specRowSelector(specFileName)} [data-cy="run-status-dot-${dotNumber}"]`
}

function dotsSkeletonSelector (specFileName: string) {
  return `${specRowSelector(specFileName)} [data-cy="run-status-dots-loading"]`
}

function averageDurationSelector (specFileName: string) {
  return `${specRowSelector(specFileName)} [data-cy="average-duration"]`
}

describe('ACI - Spec Explorer', { viewportWidth: 1200 }, () => {
  context('Latest runs and Average duration', () => {
    beforeEach(() => {
      cy.withCtx((ctx) => {
        // clear cloud cache
        ctx.cloud.reset()
      })

      cy.scaffoldProject('cypress-in-cypress')
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()

      cy.loginUser()

      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
      })
    })

    it('shows placeholders when no runs are recorded', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
          obj.result.data.cloudSpecByPath = {
            __typename: 'CloudProjectSpecNotFound',
            retrievedAt: new Date().toISOString(),
            id: `id${obj.variables.specPath}`,
            specRuns: {
              __typename: 'CloudSpecRunConnection',
              nodes: [],
            },
            averageDuration: null,
          }
        }

        return obj.result
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()

      {
        // TODO: remove code in this scope once the caching issue is resolved
        cy.wait(300)
        cy.reload()
      }

      cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
      cy.findAllByTestId('run-status-dot-latest').should('not.have.class', 'animate-spin')
      cy.findAllByTestId('average-duration').should('not.exist')
    })

    it('shows correct data when runs are recorded', () => {
      cy.remoteGraphQLIntercept(async (obj) => {
        const fakeRuns = (statuses: string[], idPrefix: string) => {
          return statuses.map((s, idx) => {
            return {
              __typename: 'CloudSpecRun',
              id: `SpecRun_${idPrefix}_${idx}`,
              status: s,
              createdAt: new Date('2022-05-08T03:17:00').toISOString(),
              completedAt: new Date('2022-05-08T05:17:00').toISOString(),
              runNumber: 432,
              groupCount: 2,
              specDuration: {
                min: 143003, // 2:23
                max: 159120, // 3:40
                __typename: 'SpecDataAggregate',
              },
              testsFailed: {
                min: 1,
                max: 2,
                __typename: 'SpecDataAggregate',
              },
              testsPassed: {
                min: 22,
                max: 23,
                __typename: 'SpecDataAggregate',
              },
              testsSkipped: {
                min: null,
                max: null,
                __typename: 'SpecDataAggregate',
              },
              testsPending: {
                min: 1,
                max: 2,
                __typename: 'SpecDataAggregate',
              },
              url: 'https://google.com',
            }
          })
        }

        if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
          const statuses = obj.variables.specPath === 'cypress/e2e/accounts/accounts_list.spec.js' ?
            ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'] :
            obj.variables.specPath === 'cypress/e2e/app.spec.js' ?
              [] :
              ['RUNNING', 'PASSED']

          const runs = fakeRuns(statuses, obj.variables.specPath)
          const averageDuration = obj.variables.specPath ===
            'cypress/e2e/accounts/accounts_list.spec.js' ?
            12000 : // 0:12
            123000 // 2:03

          obj.result.data.cloudSpecByPath = {
            __typename: 'CloudProjectSpec',
            retrievedAt: new Date().toISOString(),
            id: `id${obj.variables.specPath}`,
            specRuns: {
              __typename: 'CloudSpecRunConnection',
              nodes: runs,
            },
            averageDuration,
          }
        }

        return obj.result
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()

      // verify tooltips
      cy.get('.underline').contains('Latest runs').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('Status of the latest runs from the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('not.exist')
      cy.get('.underline').contains('Latest runs').trigger('mouseleave')

      cy.get('.underline').contains('Average duration').trigger('mouseenter')
      cy.get('.v-popper__popper--shown').contains('Average spec duration of the latest runs from the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('not.exist')
      cy.get('.underline').contains('Average duration').trigger('mouseleave')

      // initially, visible specs should be loading
      cy.get('[data-cy-row="accounts_list.spec.js"] [data-cy="run-status-dots-loading"]')
      cy.get('[data-cy-row="app.spec.js"] [data-cy="run-status-dots-loading"]')
      {
        // TODO: remove code in this scope once the caching issue is resolved
        cy.wait(300)
        cy.reload()
      }

      cy.get(dotSelector('accounts_list.spec.js', 0)).should('have.class', 'icon-light-orange-400')
      cy.get(dotSelector('accounts_list.spec.js', 1)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('accounts_list.spec.js', 2)).should('have.class', 'icon-light-red-400')
      cy.get(dotSelector('accounts_list.spec.js', 'latest')).should('not.have.class', 'animate-spin')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')

      // all should use placeholder
      cy.get(dotSelector('app.spec.js', 0)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('app.spec.js', 1)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('app.spec.js', 2)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('app.spec.js', 'latest')).should('not.have.class', 'animate-spin')
      cy.get(averageDurationSelector('app.spec.js')).contains('2:03')

      // oldest 2 status dots will use placeholder
      cy.get(dotSelector('accounts_new.spec.js', 0)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('accounts_new.spec.js', 1)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('accounts_new.spec.js', 2)).should('have.class', 'icon-light-jade-400')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).should('have.class', 'animate-spin')
      cy.get(averageDurationSelector('accounts_new.spec.js')).contains('2:03')

      // make sure the virtualized list didn't load z008.spec.js
      cy.get(specRowSelector('z008.spec.js')).should('not.exist')

      cy.get('.spec-list-container').scrollTo('bottom')
      // scrolling down should load z008.spec.js with loading status
      cy.get(dotsSkeletonSelector('z008.spec.js'))
      {
        // TODO: remove code in this scope once the caching issue is resolved
        cy.wait(300)
        cy.reload()
        cy.get('.spec-list-container').scrollTo('bottom')
      }

      // then z008.spec.js should show proper data
      cy.get(dotSelector('z008.spec.js', 0)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('z008.spec.js', 1)).should('have.class', 'icon-light-gray-300')
      cy.get(dotSelector('z008.spec.js', 2)).should('have.class', 'icon-light-jade-400')
      cy.get(dotSelector('z008.spec.js', 'latest')).should('have.class', 'animate-spin')
      cy.get(averageDurationSelector('z008.spec.js')).contains('2:03')
    })
  })
})
