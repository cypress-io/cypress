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
    })

    cy.remoteGraphQLIntercept(async (obj) => {
      await new Promise((r) => setTimeout(r, 20))
      if (obj.result.data && 'cloudSpecByPath' in obj.result.data) {
        if (obj.variables.specPath.includes('123.spec.js')) {
          obj.result.data.cloudSpecByPath = {
            __typename: 'CloudProjectSpec',
            id: `id${obj.variables.specPath}`,
            retrievedAt: new Date().toISOString(),
            averageDuration: null,
            specRuns: {
              __typename: 'CloudSpecRunConnection',
              nodes: [],
            },
            isConsideredFlaky: true,
            flakyStatus: {
              __typename: 'CloudProjectSpecFlakyStatus',
              severity: 'LOW',
              flakyRuns: 2,
              flakyRunsWindow: 50,
              lastFlaky: 2,
              dashboardUrl: '#',
            },
          }
        } else {
          obj.result.data.cloudSpecByPath = {
            __typename: 'CloudProjectSpec',
            id: `id${obj.variables.specPath}`,
            retrievedAt: new Date().toISOString(),
            averageDuration: null,
            specRuns: {
              __typename: 'CloudSpecRunConnection',
              nodes: [],
            },
            isConsideredFlaky: false,
            flakyStatus: null,
          }
        }
      } else if (obj.result.data && 'cloudLatestRunUpdateSpecData' in obj.result.data) {
        obj.result.data.cloudLatestRunUpdateSpecData = {
          __typename: 'CloudLatestRunUpdateSpecData',
          mostRecentUpdate: new Date('2022-06-10').toISOString(),
          pollingInterval: 60,
        }
      }

      return obj.result
    })

    cy.visitApp()
    cy.contains('E2E specs')
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
