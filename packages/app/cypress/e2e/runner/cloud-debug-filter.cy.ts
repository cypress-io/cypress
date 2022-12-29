describe('cloud debug test filtering', () => {
  it('works with nested suites', () => {
    cy.scaffoldProject('cloud-debug-filter')
    cy.openProject('cloud-debug-filter')
    cy.startAppServer('e2e')
    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js`)

    cy.waitForSpecToFinish()

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 't2', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t2')

    cy.get('.debug-dismiss').contains('1 / 4 tests').click()
    cy.waitForSpecToFinish({ passCount: 2, failCount: 2 })

    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 's1 t4', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/test.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t4')
  })

  it('works with skips and onlys', () => {
    cy.scaffoldProject('cloud-debug-filter')
    cy.openProject('cloud-debug-filter')
    cy.startAppServer('e2e')
    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js`)

    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    // .only is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 't1', status: 'FAILED' }, { titlePath: 't3', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t1')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .only is ignored as it is not in set of filtered tests
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 't3', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })

    cy.get('.runnable-title').contains('t3')

    cy.get('.debug-dismiss').click().waitForSpecToFinish()

    // .skip is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 't2', status: 'FAILED' }, { titlePath: 't3', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1, pendingCount: 1 })
    cy.get('.runnable-title').first().contains('t2')
    cy.get('.runnable-title').last().contains('t3')

    cy.get('.debug-dismiss').contains('2 / 4 tests').click().waitForSpecToFinish()

    // suite.only is respected
    cy.withCtx((ctx) => {
      ctx.coreData.cloud.testsForRunResults = [{ titlePath: 't3', status: 'FAILED' }, { titlePath: 's1 t4', status: 'FAILED' }]
    })

    cy.visitApp(`specs/runner?file=cypress/e2e/skip-and-only.cy.js&runId=123`)
    cy.waitForSpecToFinish({ passCount: 0, failCount: 1 })
    cy.get('.runnable-title').contains('t4')
  })
})
