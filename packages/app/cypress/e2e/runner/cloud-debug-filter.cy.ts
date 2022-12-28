describe('cloud debug test filtering', () => {
  it('works with nested suites', () => {
    cy.scaffoldProject('cloud-debug-filter')
    cy.openProject('cloud-debug-filter')
    cy.startAppServer('e2e')
    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js`)

    cy.waitForSpecToFinish()

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 'should fail - 1', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('should fail - 1')

    cy.get('.debug-dismiss').contains('1 / 4 tests').click()
    cy.waitForSpecToFinish({
      passCount: 2,
      failCount: 2,
    })

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 'nested - 1 should fail - 2', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('should fail - 2')
  })

  it('works with skips and onlys', () => {
    cy.scaffoldProject('cloud-debug-filter')
    cy.openProject('cloud-debug-filter')
    cy.startAppServer('e2e')
    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js`)

    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    // .only is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 'should fail - 1', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('should fail - 1')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .only is ignored as it is not in set of filtered tests
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 'should fail - 3', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('should fail - 3')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .skip is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 'should fail - 2', status: 'FAILED' }, { titlePath: 'should fail - 3', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1, pendingCount: 1 })

    cy.get('.runnable-title').first().contains('should fail - 2')
    cy.get('.runnable-title').last().contains('should fail - 3')

    cy.get('.debug-dismiss').contains('2 / 3 tests')
  })
})
