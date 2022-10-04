import type Sinon from 'sinon'

describe('slow network: launchpad', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.withCtx((ctx, o) => {
      const currentStubbbedFetch = ctx.util.fetch;

      (ctx.util.fetch as Sinon.SinonStub).restore()
      o.testState.pendingFetches = []
      o.sinon.stub(ctx.util, 'fetch').callsFake(async (input, init) => {
        const dfd = o.pDefer()

        o.testState.pendingFetches.push(dfd)
        const result = await currentStubbbedFetch(input, init)

        setTimeout(dfd.resolve, 60000)
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

  it('loads through to the browser screen when the network is slow', () => {
    cy.loginUser()
    cy.visitLaunchpad()
    cy.get('[data-cy=top-nav-cypress-version-current-link]').should('not.exist')
    cy.contains('E2E Testing').click()
    cy.get('h1').should('contain', 'Choose a browser')
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/21897
  it.skip('shows the versions after they resolve', () => {
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
