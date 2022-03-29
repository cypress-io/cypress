import type { GitInfo } from '@packages/data-context/src/sources'

describe('remoteGuard: App', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer('e2e')
  })

  describe('gitInfo', () => {
    it('resolves without the gitInfo if it takes longer than 1.5 sec to resolve', () => {
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.git, 'gitInfo').get(() => {
          return async (): Promise<GitInfo> => {
            await new Promise((resolve) => {
              o.testState.resolve ??= []
              o.testState.resolve.push(resolve)
              setTimeout(resolve, 2000)
            })

            return {
              author: 'Test User',
              lastModifiedTimestamp: new Date().toString(),
              lastModifiedHumanReadable: '1 day ago',
            }
          }
        })
      })

      cy.visitApp()
      cy.contains('fixture.js', { timeout: 100 }).closest('[data-cy="specs-list-row"]').should('not.contain', 'Modified just now')
      cy.withCtx((ctx, o) => {
        o.testState.resolve.forEach((r) => r())
      })

      cy.contains('fixture.js').closest('[data-cy="specs-list-row"]').should('contain', 'Modified just now')
    })
  })
})
