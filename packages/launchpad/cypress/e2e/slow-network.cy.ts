import type Sinon from 'sinon'

describe('slow network: launchpad', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')

    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx.migration, 'getVideoEmbedHtml').callsFake(async () => {
        // stubbing the AbortController is a bit difficult with fetch ctx, so instead
        // assume the migration handler itself returned null from a timeout
        return null
      })

      const currentStubbedFetch = ctx.util.fetch;

      (ctx.util.fetch as Sinon.SinonStub).restore()
      o.testState.pendingFetches = []
      o.sinon.stub(ctx.util, 'fetch').callsFake(async (input, init) => {
        const dfd = o.pDefer()

        o.testState.pendingFetches.push(dfd)

        let resolveTime = 60000

        const result = await currentStubbedFetch(input, init)

        setTimeout(dfd.resolve, resolveTime)
        await dfd.promise

        return result
      })
    })

    cy.openProject('todos')
  })

  afterEach(() => {
    cy.withCtx(async (ctx, o) => {
      o.testState.pendingFetches.map((f) => f.resolve())
    })
  })

  // NOTE: testing the videoEmbedHTML query abortController with the current setup is a bit difficult.
  // The timeout happens as needed, but is not functioning correctly in this E2E test
  it('loads through to the browser screen when the network is slow', () => {
    cy.loginUser()
    cy.visitLaunchpad()
    cy.get('[data-cy=top-nav-cypress-version-current-link]').should('not.exist')
    cy.contains('E2E Testing').click()
    cy.get('h1').should('contain', 'Choose a browser')
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/21897
  it('shows the versions after they resolve', { retries: 15 }, () => {
    cy.visitLaunchpad()
    cy.get('[data-cy=top-nav-cypress-version-current-link]').should('not.exist')
    cy.contains('Log in')
    cy.wait(500)
    cy.withCtx(async (ctx, o) => {
      o.testState.pendingFetches.map((f) => f.resolve())
    })

    // This will show up after it resolves
    cy.get('[data-cy=top-nav-cypress-version-current-link]')
  })
})
