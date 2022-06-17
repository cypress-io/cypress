import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'
import type { CloudRunStatus } from '@packages/frontend-shared/src/generated/graphql'

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

function specShouldShow (specFileName: string, runDotsClasses: string[], latestRunStatus: CloudRunStatus|'PLACEHOLDER') {
  const latestStatusSpinning = latestRunStatus === 'RUNNING'

  type dotIndex = Parameters<typeof dotSelector>[1];
  const indexes: dotIndex[] = [0, 1, 2]

  indexes.forEach((i) => {
    return cy.get(dotSelector(specFileName, i)).should('have.class', `icon-light-${runDotsClasses.length > i ? runDotsClasses[i] : 'gray-300'}`)
  })

  cy.get(dotSelector(specFileName, 'latest'))
  .should(`${latestStatusSpinning ? '' : 'not.'}have.class`, 'animate-spin')
  .and('have.attr', 'data-cy-run-status', latestRunStatus)

  // TODO: add link verification
  // if (latestRunStatus !== 'PLACEHOLDER') {
  //   cy.get(`${specRowSelector(specFileName)} [data-cy="run-status-dots"]`).validateExternalLink('https://google.com')
  // }
}

function simulateRunData () {
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
      // simulate network latency to allow for caching to register
      await new Promise((r) => setTimeout(r, 20))

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
}

function allVisibleSpecsShouldBePlaceholders () {
  cy.findAllByTestId('run-status-dot-0').should('have.class', 'icon-light-gray-300')
  cy.findAllByTestId('run-status-dot-1').should('have.class', 'icon-light-gray-300')
  cy.findAllByTestId('run-status-dot-2').should('have.class', 'icon-light-gray-300')
  cy.findAllByTestId('run-status-dot-latest')
  .should('not.have.class', 'animate-spin')
  .and('have.attr', 'data-cy-run-status', 'PLACEHOLDER')

  cy.get('.spec-list-container').scrollTo('bottom')
  cy.get('.spec-list-container').scrollTo('bottom')
}

describe('ACI - Latest runs and Average duration', { viewportWidth: 1200, viewportHeight: 900 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()

    cy.withCtx((ctx) => {
      // clear cloud cache
      ctx.cloud.reset()
    })

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
    })
  })

  afterEach(() => {
    cy.withCtx((ctx) => {
      // clear cloud cache
      ctx.cloud.reset()
    })
  })

  context('when no runs are recorded', () => {
    beforeEach(() => {
      cy.loginUser()

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
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })
  })

  context('when logged out', () => {
    beforeEach(() => {
      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    it('shows correct tooltips with log in buttons', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'View the status of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('have.text', 'Log in to Cypress Dashboard').click()
      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log In')
        cy.get('[aria-label="Close"]').click()
      })

      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'View the average spec durations of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('have.text', 'Log in to Cypress Dashboard').click()
      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log In')
        cy.get('[aria-label="Close"]').click()
      })

      cy.findByTestId('average-duration-header').trigger('mouseleave')
    })
  })

  context('when project disconnected', () => {
    beforeEach(() => {
      cy.loginUser()
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.project, 'projectId').resolves(null)
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    it('shows correct tooltips with log in buttons', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'View the status of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('have.text', 'Connect your project').click()
      cy.findByRole('dialog', { name: 'Create project' }).within(() => {
        cy.get('[aria-label="Close"]').click({ force: true })
      })

      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'View the average spec durations of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('have.text', 'Connect your project').click()
      cy.findByRole('dialog', { name: 'Create project' }).within(() => {
        cy.get('[aria-label="Close"]').click({ force: true })
      })

      cy.findByTestId('average-duration-header').trigger('mouseleave')
    })
  })

  context('when not using a branch', () => {
    beforeEach(() => {
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value(undefined)
      })

      cy.loginUser()

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })
  })

  context('when runs are recorded', () => {
    beforeEach(() => {
      cy.loginUser()

      simulateRunData()

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows correct tooltips', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'The status of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('not.exist')
      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.contains('.v-popper__popper--shown', 'The average spec durations of your latest runs in the Cypress Dashboard')
      cy.get('.v-popper__popper--shown button').should('not.exist')
      cy.findByTestId('average-duration-header').trigger('mouseleave')
    })

    it('shows accurate latest runs and average duration data', () => {
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')

      // all should use placeholder
      specShouldShow('app.spec.js', [], 'PLACEHOLDER')
      cy.get(averageDurationSelector('app.spec.js')).contains('2:03')
      // shouldn't have a tooltip
      cy.get(dotSelector('app.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('not.exist')
      cy.get(dotSelector('app.spec.js', 'latest')).trigger('mouseleave')

      // oldest 2 status dots will use placeholder
      specShouldShow('accounts_new.spec.js', ['gray-300', 'gray-300', 'jade-400'], 'RUNNING')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')
      // TODO: verify the contents of the tooltip
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_new.spec.js')).contains('2:03')
    })

    it('lazily loads data for off-screen specs', () => {
      // make sure the virtualized list didn't load z008.spec.js
      cy.get(specRowSelector('z008.spec.js')).should('not.exist')

      cy.get('.spec-list-container').scrollTo('bottom')
      // scrolling down should load z008.spec.js with loading status
      cy.get(dotsSkeletonSelector('z008.spec.js')).should('exist')

      // then z008.spec.js should show proper data
      specShouldShow('z008.spec.js', ['gray-300', 'gray-300', 'jade-400'], 'RUNNING')
      cy.get(averageDurationSelector('z008.spec.js')).contains('2:03')
    })
  })

  context('polling indicates new data', () => {
    beforeEach(() => {
      cy.loginUser()

      cy.remoteGraphQLIntercept(async (obj, testState) => {
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

        const pollingCounter = testState.pollingCounter ?? 0

        if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
          // simulate network latency to allow for caching to register
          await new Promise((r) => setTimeout(r, 20))

          const statuses = pollingCounter < 2 ? ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'] : ['FAILED', 'PASSED', 'FAILED', 'CANCELLED', 'ERRORED']
          const runs = fakeRuns(statuses, obj.variables.specPath)
          const averageDuration = pollingCounter < 2 ? 12000 : 13000

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
        } else if (obj.result.data && 'cloudLatestRunUpdateSpecData' in obj.result.data) {
          const mostRecentUpdate = pollingCounter > 1 ? new Date().toISOString() : new Date('2022-06-10').toISOString()
          // initial polling interval is set to every second to avoid long wait times
          const pollingInterval = pollingCounter > 1 ? 30 : 1

          obj.result.data.cloudLatestRunUpdateSpecData = {
            __typename: 'CloudLatestRunUpdateSpecData',
            mostRecentUpdate,
            pollingInterval,
          }

          testState.pollingCounter = pollingCounter + 1
        }

        return obj.result
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('refreshes view to reflect new data', () => {
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')
      // TODO: verify the contents of the tooltip
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')

      cy.wait(1200)

      // new results should be shown
      specShouldShow('accounts_list.spec.js', ['gray-300', 'red-400', 'jade-400'], 'FAILED')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')
      // TODO: verify the contents of the tooltip
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:13')
    })
  })

  context('polling indicates no new data', () => {
    beforeEach(() => {
      cy.loginUser()

      cy.remoteGraphQLIntercept(async (obj, testState) => {
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

        const pollingCounter = testState.pollingCounter ?? 0

        if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
          // simulate network latency to allow for caching to register
          await new Promise((r) => setTimeout(r, 20))

          const statuses = pollingCounter < 2 ? ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'] : ['FAILED', 'PASSED', 'FAILED', 'CANCELLED', 'ERRORED']
          const runs = fakeRuns(statuses, obj.variables.specPath)
          const averageDuration = pollingCounter < 2 ? 12000 : 13000

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
        } else if (obj.result.data && 'cloudLatestRunUpdateSpecData' in obj.result.data) {
          const mostRecentUpdate = new Date('2022-06-10').toISOString()
          // initial polling interval is set to every second to avoid long wait times
          const pollingInterval = pollingCounter > 1 ? 30 : 1

          obj.result.data.cloudLatestRunUpdateSpecData = {
            __typename: 'CloudLatestRunUpdateSpecData',
            mostRecentUpdate,
            pollingInterval,
          }

          testState.pollingCounter = pollingCounter + 1
        }

        return obj.result
      })

      cy.visitApp()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows the same data after polling', () => {
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')
      // TODO: verify the contents of the tooltip
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')

      cy.wait(1200)

      // new results should be shown
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')
      // TODO: verify the contents of the tooltip
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')
    })
  })
})

describe('ACI - Latest runs and Average duration', { viewportWidth: 1200 }, () => {
  context('when offline', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.goOffline()
      cy.wait(300)
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()

      cy.withCtx((ctx) => {
        // clear cloud cache
        ctx.cloud.reset()
      })

      cy.loginUser()

      simulateRunData()
      cy.visitApp()

      cy.findByTestId('sidebar-link-specs-page').click()

      // after navigating to a new page, the browser needs to go offline again
      cy.goOffline()
    })

    afterEach(() => {
      cy.withCtx((ctx) => {
        // clear cloud cache
        ctx.cloud.reset()
      })
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    it('shows offline alert then hides it after coming online', () => {
      cy.findByTestId('offline-alert')
      .should('contain.text', defaultMessages.specPage.offlineWarning.title)
      .and('contain.text', defaultMessages.specPage.offlineWarning.explainer)

      cy.goOnline()
      cy.findByTestId('offline-alert').should('not.exist')
    })
  })
})
