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

function makeTestingCloudLink (status: string) {
  return `https://google.com?utm_medium=Specs+Latest+Runs+Dots&utm_campaign=${status.toUpperCase()}&utm_source=Binary%3A+App`
}

function assertCorrectRunsLink (specFileName: string, status: string) {
  // we avoid the full `cy.validateExternalLink` here because that command
  // clicks the link, which focuses the link causing tooltips to appear,
  // which produces problems elsewhere testing tooltip behavior
  cy.findByRole('link', { name: specFileName })
  .should('have.attr', 'href', makeTestingCloudLink(status))
  .should('have.attr', 'data-cy', 'external') // to confirm the ExternalLink component is used
}

function validateTooltip (status: string) {
  cy.get(`a[href="${makeTestingCloudLink(status)}"]`)
  .should('contain.text', 'accounts_new.spec.js')
  .and('contain.text', '2:23 - 2:39')
  .and('contain.text', 'skipped 0')
  .and('contain.text', 'pending 1-2')
  .and('contain.text', `passed 22-23`)
  .and('contain.text', 'failed 1-2')
  .invoke('text')
  .should((text) => {
    expect(text).to.match(/\d+ (day|week|month|year)s? ago/)
  })
}

function specShouldShow (specFileName: string, runDotsClasses: string[], latestRunStatus: CloudRunStatus|'PLACEHOLDER') {
  const latestStatusSpinning = latestRunStatus === 'RUNNING'

  type dotIndex = Parameters<typeof dotSelector>[1];
  const indexes: Exclude<dotIndex, 'latest'>[] = [0, 1, 2]

  indexes.forEach((i) => {
    return cy.get(dotSelector(specFileName, i)).should('have.class', `icon-light-${runDotsClasses.length > i ? runDotsClasses[i] : 'gray-300'}`)
  })

  cy.get(dotSelector(specFileName, 'latest'))
  .should(`${latestStatusSpinning ? '' : 'not.'}have.class`, 'animate-spin')
  .and('have.attr', 'data-cy-run-status', latestRunStatus)

  if (runDotsClasses?.length) {
    assertCorrectRunsLink(`${specFileName} test results`, latestRunStatus)
  } else {
    cy.findByRole('link', { name: `${specFileName} test results` }).should('not.exist')
  }
}

function simulateRunData () {
  cy.remoteGraphQLIntercept(async (obj) => {
    if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
      obj.result.data = {
        'cloudProjectBySlug': {
          '__typename': 'CloudProject',
          'id': 'Q2xvdWRQcm9qZWN0OnZncXJ3cA==',
          'runsByCommitShas': [
            {
              'id': 'Q2xvdWRSdW46TUdWZXhvQkRPNg==',
              'runNumber': 136,
              'status': 'FAILED',
              'commitInfo': {
                'sha': 'commit2',
                '__typename': 'CloudRunCommitInfo',
              },
              '__typename': 'CloudRun',
            },
            {
              'id': 'Q2xvdWRSdW46ckdXb2wzbzJHVg==',
              'runNumber': 134,
              'status': 'PASSED',
              'commitInfo': {
                'sha': '37fa5bfb9e774d00a03fe8f0d439f06ec70f533d',
                '__typename': 'CloudRunCommitInfo',
              },
              '__typename': 'CloudRun',
            },
          ],
        },
        'pollingIntervals': {
          'runsByCommitShas': 30,
          '__typename': 'CloudPollingIntervals',
        },
      }
    }

    return obj.result
  })

  cy.remoteGraphQLInterceptBatched(async (obj) => {
    if (obj.field !== 'cloudSpecByPath') {
      return obj.result
    }

    const fakeRuns = (statuses: string[], idPrefix: string) => {
      return statuses.map((s, idx) => {
        return {
          __typename: 'CloudSpecRun',
          id: `SpecRun_${idPrefix}_${idx}`,
          status: s,
          createdAt: new Date('2022-05-08T03:17:00').toISOString(),
          completedAt: new Date('2022-05-08T05:17:00').toISOString(),
          basename: idPrefix.substring(idPrefix.lastIndexOf('/') + 1, idPrefix.indexOf('.')),
          path: idPrefix,
          extension: idPrefix.substring(idPrefix.indexOf('.')),
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

    // simulate network latency to allow for caching to register
    await new Promise((r) => setTimeout(r, 20))

    const statuses = obj.variables.specPath?.includes('accounts_list.spec.js') ?
      ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'] :
      obj.variables.specPath?.includes('app.spec.js') ?
        [] :
        ['RUNNING', 'PASSED']

    const runs = fakeRuns(statuses, obj.variables.specPath)
    const averageDuration = obj.variables.specPath?.includes('accounts_list.spec.js') ?
      12000 : // 0:12
      123000 // 2:03

    return {
      __typename: 'CloudProjectSpec',
      retrievedAt: new Date().toISOString(),
      id: `id${obj.variables.specPath}`,
      specRunsForRunIds: runs,
      averageDurationForRunIds: averageDuration,
    }
  })
}

function allVisibleSpecsShouldBePlaceholders () {
  cy.findAllByTestId('run-status-empty').should('be.visible').should('have.class', 'text-gray-400')
  cy.findAllByTestId('run-status-dot-0').should('not.exist')
  cy.findAllByTestId('run-status-dot-1').should('not.exist')
  cy.findAllByTestId('run-status-dot-2').should('not.exist')
  cy.findAllByTestId('run-status-dot-latest').should('not.exist')

  cy.findByTestId('spec-list-container').scrollTo('bottom')
}

describe('App/Cloud Integration - Latest runs and Average duration', { viewportWidth: 1200, viewportHeight: 900 }, () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer()

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
      ctx.git?.__setGitHashesForTesting(['commit1', 'commit2'])
    })
  })

  // TODO: Flaky test: Sometimes this test renders the empty view instead of the placeholder
  context.skip('when no runs are recorded', () => {
    it('shows placeholders for all visible specs', { defaultCommandTimeout: 6000 }, () => {
      cy.loginUser()

      cy.remoteGraphQLInterceptBatched(async (obj) => {
        return {
          __typename: 'CloudProjectSpecNotFound',
          retrievedAt: new Date().toISOString(),
          message: 'Spec Not Found',
        }
      })

      cy.visitApp()
      cy.specsPageIsVisible()
      allVisibleSpecsShouldBePlaceholders()
    })
  })

  context('when logged out', () => {
    beforeEach(() => {
      cy.visitApp()
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    it('shows correct tooltips with log in buttons', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'Connect to Cypress Cloud to see the status of your latest runs')
      .find('button')
      .should('have.text', 'Log in to Cypress Cloud')
      .click()

      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log in')
        cy.get('[aria-label="Close"]').click()
      })

      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'Connect to Cypress Cloud to see the average spec durations of your latest runs')
      .find('button')
      .should('have.text', 'Log in to Cypress Cloud')
      .click()

      cy.findByRole('dialog', { name: 'Log in to Cypress' }).within(() => {
        cy.get('button').contains('Log in')
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
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    it('shows correct tooltips with log in buttons', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'Connect to Cypress Cloud to see the status of your latest runs')
      .find('button')
      .should('have.text', 'Connect your project')
      .click()

      cy.findByRole('dialog', { name: 'Create project' }).within(() => {
        cy.get('[aria-label="Close"]').click({ force: true })
      })

      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'Connect to Cypress Cloud to see the average spec durations of your latest runs')
      .find('button')
      .should('have.text', 'Connect your project')
      .click()

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
      cy.specsPageIsVisible()
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
      cy.specsPageIsVisible()
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    it('shows correct tooltips', () => {
      cy.findByTestId('latest-runs-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'The status of your latest runs in Cypress Cloud')
      .find('button')
      .should('not.exist')

      cy.findByTestId('latest-runs-header').trigger('mouseleave')

      cy.findByTestId('average-duration-header').trigger('mouseenter')
      cy.get('.v-popper__popper--shown')
      .should('contain', 'The average spec durations of your latest runs in Cypress Cloud')
      .find('button')
      .should('not.exist')

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

      cy.findByTestId('spec-list-container').scrollTo('top')
      // oldest 2 status dots will use placeholder
      specShouldShow('accounts_new.spec.js', ['gray-300', 'gray-300', 'jade-400'], 'RUNNING')
      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseenter')
      cy.get('.v-popper__popper--shown').should('exist')

      validateTooltip('Running')

      cy.get(dotSelector('accounts_new.spec.js', 'latest')).trigger('mouseleave')
      cy.get(averageDurationSelector('accounts_new.spec.js')).contains('2:03')
    })

    it('lazily loads data for off-screen specs', { viewportHeight: 500 }, () => {
      // make sure the virtualized list didn't load z008.spec.js
      cy.get(specRowSelector('z008.spec.js')).should('not.exist')

      cy.findByTestId('spec-list-container').scrollTo('bottom')
      // scrolling down should load z008.spec.js with loading status
      cy.get(dotsSkeletonSelector('z008.spec.js')).should('exist')

      // then z008.spec.js should show proper data
      specShouldShow('z008.spec.js', ['gray-300', 'gray-300', 'jade-400'], 'RUNNING')
      cy.get(averageDurationSelector('z008.spec.js')).contains('2:03')
    })

    describe('preserving tree expansion state', () => {
      it('should preserve state when row data is updated without additions/deletions', () => {
        // Collapse a directory
        cy.get('button[data-cy="row-directory-depth-1"]').first()
        .should('have.attr', 'aria-expanded', 'true')
        .click()
        .should('have.attr', 'aria-expanded', 'false')

        // Trigger cloud specs list change by scrolling
        cy.findByTestId('spec-list-container')
        .scrollTo('bottom', { duration: 500 })
        .wait(100)
        .scrollTo('top', { duration: 500 })

        // Directory should still be collapsed
        cy.get('button[data-cy="row-directory-depth-1"]').first()
        .should('have.attr', 'aria-expanded', 'false')
      })

      it('should expand all directories when search is performed', () => {
        // Collapse a directory
        cy.get('button[data-cy="row-directory-depth-0"]').first()
        .should('have.attr', 'aria-expanded', 'true')
        .click()
        .should('have.attr', 'aria-expanded', 'false')
        .then((dir) => {
          // Perform a search/filter operation
          cy.findByLabelText('Search specs').type(dir.text()[0])
        })

        // Previously-collapsed directory should automatically expand
        cy.get('button[data-cy="row-directory-depth-0"]').first()
        .should('have.attr', 'aria-expanded', 'true')
      })
    })

    it('should retain data after app navigation', () => {
      // App/Cloud Integration data should load and render to start
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')

      // Move to Settings page and wait for render
      cy.get('a[href="#/settings"]').click()
      cy.location('hash').should('include', '/settings')
      cy.findByText('Project settings').should('be.visible')

      // Move back to Specs page and wait for render
      cy.get('a[href="#/specs"]').click()
      cy.location('hash').should('include', '/specs')
      cy.findByText('E2E specs').should('be.visible')

      // App/Cloud Integration data should still be loaded and rendered
      specShouldShow('accounts_list.spec.js', ['orange-400', 'gray-300', 'red-400'], 'PASSED')
      cy.get(averageDurationSelector('accounts_list.spec.js')).contains('0:12')
    })
  })

  context('polling indicates new data', () => {
    beforeEach(() => {
      cy.loginUser()

      cy.remoteGraphQLIntercept(async (obj, testState) => {
        const pollingCounter = testState.pollingCounter ?? 0

        if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
          obj.result.data = {
            'cloudProjectBySlug': {
              '__typename': 'CloudProject',
              'id': 'Q2xvdWRQcm9qZWN0OnZncXJ3cA==',
              'runsByCommitShas': [
                {
                  'id': 'Q2xvdWRSdW46TUdWZXhvQkRPNg==',
                  'runNumber': 136,
                  'status': 'PASSED',
                  'commitInfo': {
                    'sha': 'commit2',
                    '__typename': 'CloudRunCommitInfo',
                  },
                  '__typename': 'CloudRun',
                },
                {
                  'id': 'Q2xvdWRSdW46ckdXb2wzbzJHVg==',
                  'runNumber': 134,
                  'status': 'FAILED',
                  'commitInfo': {
                    'sha': '37fa5bfb9e774d00a03fe8f0d439f06ec70f533d',
                    '__typename': 'CloudRunCommitInfo',
                  },
                  '__typename': 'CloudRun',
                },
              ],
            },
            'pollingIntervals': {
              'runsByCommitShas': 1,
              '__typename': 'CloudPollingIntervals',
            },
          }

          if (pollingCounter > 2) {
            obj.result.data.cloudProjectBySlug.runsByCommitShas.shift({
              'id': 'Q2xvdWRSdW46TUdWZXhvQkRPNg==',
              'runNumber': 138,
              'status': 'FAILED',
              'commitInfo': {
                'sha': 'commit2',
                '__typename': 'CloudRunCommitInfo',
              },
              '__typename': 'CloudRun',
            })
          }

          if (pollingCounter > 5) {
            obj.result.data.pollingIntervals.runsByCommitShas = 100
          }

          testState.pollingCounter = pollingCounter + 1
        }

        return obj.result
      })

      cy.remoteGraphQLInterceptBatched(async (obj, testState) => {
        if (obj.field !== 'cloudSpecByPath') {
          return obj.result
        }

        const fakeRuns = (statuses: string[], idPrefix: string) => {
          return statuses.map((s, idx) => {
            return {
              __typename: 'CloudSpecRun',
              id: `SpecRun_${idPrefix}_${idx}`,
              status: s,
              createdAt: new Date('2022-05-08T03:17:00').toISOString(),
              completedAt: new Date('2022-05-08T05:17:00').toISOString(),
              basename: idPrefix.substring(idPrefix.lastIndexOf('/') + 1, idPrefix.indexOf('.')),
              path: idPrefix,
              extension: idPrefix.substring(idPrefix.indexOf('.')),
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

        // simulate network latency to allow for caching to register
        await new Promise((r) => setTimeout(r, 20))

        const statuses = pollingCounter < 2 ? ['PASSED', 'FAILED', 'CANCELLED', 'ERRORED'] : ['FAILED', 'PASSED', 'FAILED', 'CANCELLED', 'ERRORED']
        const runs = fakeRuns(statuses, obj.variables.specPath)
        const averageDuration = pollingCounter < 2 ? 12000 : 13000

        return {
          __typename: 'CloudProjectSpec',
          retrievedAt: new Date().toISOString(),
          id: `id${obj.variables.specPath}`,
          specRunsForRunIds: runs,
          averageDurationForRunIds: averageDuration,
        }
      })

      cy.visitApp()
      cy.specsPageIsVisible()
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
})

describe('App/Cloud Integration - Latest runs and Average duration', { viewportWidth: 1200 }, () => {
  context('when offline', () => {
    beforeEach(() => {
      cy.scaffoldProject('cypress-in-cypress')
      cy.goOffline()
      cy.wait(300)
      cy.openProject('cypress-in-cypress')
      cy.startAppServer()

      cy.loginUser()

      simulateRunData()
      cy.visitApp()
      cy.specsPageIsVisible()

      cy.findByTestId('sidebar-link-specs-page').click()

      // after navigating to a new page, the browser needs to go offline again
      cy.goOffline()
    })

    it('shows placeholders for all visible specs', () => {
      allVisibleSpecsShouldBePlaceholders()
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23419
    it('shows offline alert then hides it after coming online', { retries: 15 }, () => {
      cy.findByTestId('offline-alert')
      .should('contain.text', defaultMessages.specPage.offlineWarning.title)
      .and('contain.text', defaultMessages.specPage.offlineWarning.explainer)

      cy.goOnline()
      cy.findByTestId('offline-alert').should('not.exist')
    })
  })
})
