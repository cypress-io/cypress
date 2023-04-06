describe('authChange subscription', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.withCtx((ctx, o) => {
      o.sinon.stub(ctx._apis.electronApi, 'isMainWindowFocused').returns(true)

      o.testState.logInStub = o.sinon.stub(ctx._apis.authApi, 'logIn').resolves(o.AUTHED_USER)
    }, { AUTHED_USER })
  })

  const AUTHED_USER = {
    name: 'Test User',
    email: 'test@example.com',
    authToken: 'test-1234',
  }

  const setActiveUser = () => {
    cy.withCtx((ctx, o) => {
      ctx.update((d) => {
        d.user = o.AUTHED_USER
      })
    }, { AUTHED_USER })
  }

  describe('in app', () => {
    beforeEach(() => {
      cy.startAppServer()
      cy.visitApp()
    })

    it('responds to authChange subscription for login', () => {
      cy.contains('Log in')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.login('testing', 'testing')
      })

      cy.contains('Test User')
    })

    it('responds to authChange subscription for logout', () => {
      setActiveUser()
      cy.reload() // Reload to show the latest state
      cy.contains('Test User')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.logout()
      })

      cy.contains('Log in')
    })
  })

  describe('in app (component testing)', () => {
    beforeEach(() => {
      cy.startAppServer('component')
      cy.visitApp()
    })

    it('responds to authChange subscription for login', () => {
      cy.contains('Log in')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.login('testing', 'testing')
      })

      cy.contains('Test User')
    })

    it('responds to authChange subscription for logout', () => {
      setActiveUser()
      cy.reload() // Reload to show the latest state
      cy.contains('Test User')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.logout()
      })

      cy.contains('Log in')
    })
  })

  describe('in launchpad', () => {
    beforeEach(() => {
      cy.visitLaunchpad()
    })

    it('responds to authChange subscription for login', () => {
      cy.contains('Log in')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.login('testing', 'testing')
      })

      cy.contains('Test User')
    })

    it('responds to authChange subscription for logout', () => {
      setActiveUser()
      cy.visitLaunchpad()
      cy.contains('Test User')
      cy.wait(500)
      cy.withCtx(async (ctx) => {
        await ctx.actions.auth.logout()
      })

      cy.contains('Log in')
    })
  })
})
