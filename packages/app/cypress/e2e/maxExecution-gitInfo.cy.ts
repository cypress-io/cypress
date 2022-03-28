import type { GitInfo } from '@packages/data-context/src/sources'

describe('maxExecution: App', () => {
  beforeEach(() => {
    cy.scaffoldProject('todos')
    cy.openProject('todos')
    cy.startAppServer('e2e')
  })

  describe('gitInfo', () => {
    it('resolves without the gitInfo if it takes longer than a second to resolve', () => {
      cy.withCtx((ctx, o) => {
        o.sinon.stub(ctx.git, 'gitInfo').get(() => {
          return async (): Promise<GitInfo> => {
            await new Promise((resolve) => setTimeout(resolve, 5000))

            return {
              author: 'Test User',
              lastModifiedTimestamp: new Date().toString(),
              lastModifiedHumanReadable: '1 day ago',
            }
          }
        })
      })

      cy.visitApp()
    })
  })
})
