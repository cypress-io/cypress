describe('App: Spec List - Flaky Indicator', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.loginUser()

    cy.withCtx((ctx, o) => {
      // Must have a cloud project ID in order to fetch flaky data
      o.sinon.stub(ctx.project, 'projectId').resolves('abc123')
      // Must have an active Git branch in order to fetch flaky data (see @include($hasBranch) restriction)
      o.sinon.stub(ctx.lifecycleManager.git!, 'currentBranch').value('fakeBranch')
      // Don't show the "enable notifications" banner
      o.sinon.stub(ctx.coreData.localSettings.preferences, 'desktopNotificationsEnabled').value(false)

      ctx.git?.__setGitHashesForTesting(['commit1', 'commit2'])
    })

    cy.remoteGraphQLIntercept(async (obj) => {
      await new Promise((r) => setTimeout(r, 20))
      if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
        if (obj.variables.specPath.includes('123.spec.js')) {
          obj.result.data.cloudSpecByPath = {
            __typename: 'CloudProjectSpec',
            id: `id${obj.variables.specPath}`,
            retrievedAt: new Date().toISOString(),
            averageDurationForRunIds: null,
            specRunsForRunIds: [],
            isConsideredFlakyForRunIds: true,
            flakyStatusForRunIds: {
              __typename: 'CloudProjectSpecFlakyStatus',
              severity: 'LOW',
              flakyRuns: 2,
              flakyRunsWindow: 50,
              lastFlaky: 2,
              dashboardUrl: '#',
            },
          }
        }
      }

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
      await new Promise((r) => setTimeout(r, 20))

      if (obj.field === 'cloudSpecByPath') {
        if (obj.variables.specPath.includes('123.spec.js')) {
          return {
            __typename: 'CloudProjectSpec',
            id: `id${obj.variables.specPath}`,
            retrievedAt: new Date().toISOString(),
            averageDurationForRunIds: null,
            specRunsForRunIds: [],
            isConsideredFlakyForRunIds: true,
            flakyStatusForRunIds: {
              __typename: 'CloudProjectSpecFlakyStatus',
              severity: 'LOW',
              flakyRuns: 2,
              flakyRunsWindow: 50,
              lastFlaky: 2,
              dashboardUrl: '#',
            },
          }
        }

        return {
          __typename: 'CloudProjectSpec',
          id: `id${obj.variables.specPath}`,
          retrievedAt: new Date().toISOString(),
          averageDurationForRunIds: null,
          specRunsForRunIds: [],
          isConsideredFlakyForRunIds: false,
          flakyStatusForRunIds: null,
        }
      }

      return obj.result
    })

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.verifyE2ESelected()
  })

  it('shows the "Flaky" badge on specs considered flaky', () => {
    let nonFlakyCounter = 0
    let flakyCounter = 0

    cy.findAllByTestId('spec-item').each((item) => {
      const specName = item.text()
      const isFlaky = specName.includes('123.spec.js')

      cy.wrap(item).find('[data-cy="flaky-badge"]')
      .should(isFlaky ? 'be.visible' : 'not.exist')

      isFlaky ? flakyCounter++ : nonFlakyCounter++
    })
    .then(() => {
      expect(nonFlakyCounter).to.be.greaterThan(0, 'Test fails to validate flaky badge does not appear on non-flaky tests')
      expect(flakyCounter).to.be.greaterThan(0, 'Test fails to validate flaky badge does appear on flaky tests')
    })
  })

  it('shows correct data on tooltip for flaky tests', () => {
    cy.contains('[data-cy="spec-item"]', '123.spec.js').find('.v-popper').trigger('mouseenter')

    cy.findByTestId('flaky-spec-summary').within(() => {
      cy.contains('123.spec.js')
      cy.contains('Low')
      cy.contains('4% flaky rate')
      cy.contains('2 flaky runs / 50 total')
      cy.contains('Last flaky 2 runs ago')
    })
  })
})
