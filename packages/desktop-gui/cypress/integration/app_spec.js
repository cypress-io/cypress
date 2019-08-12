describe('App', function () {
  beforeEach(() => {
    cy.visitIndex().then(function (win) {
      this.win = win
      this.start = win.App.start
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'getOptions').resolves({})
      cy.stub(this.ipc, 'onMenuClicked')

      cy.stub(this.ipc, 'guiError')
    })
  })

  context('window.onerror', function () {
    beforeEach(function () {
      this.start()
    })

    it('attaches to window.onerror', function () {
      cy.wrap(this.win.onerror).should('be.a', 'function')
    })

    it('attaches to window.onunhandledrejection', function () {
      cy.wrap(this.win.onunhandledrejection).should('be.a', 'function')
    })

    it('sends name, stack, message to gui:error on synchronous error', function () {
      const err = new Error('foo')

      this.win.onerror(1, 2, 3, 4, err)

      expect(this.ipc.guiError).to.be.calledWithExactly({
        name: 'Error',
        message: 'foo',
        stack: err.stack,
      })
    })

    it('sends name, stack, message to gui:error on unhandled rejection', function () {
      const err = new Error('foo')

      this.win.foo = () => {
        return this.win.Promise.reject(err)
      }

      setTimeout(() => {
        return this.win.foo()
      }
      , 0)

      cy.wrap({}).should(function () {
        expect(this.ipc.guiError).to.be.calledWithExactly({
          name: 'Error',
          message: 'foo',
          stack: err.stack,
        })
      })
    })
  })

  context('on:menu:clicked', function () {
    beforeEach(function () {
      cy.stub(this.ipc, 'logOut').resolves()

      this.start()
    })

    it('calls log:out', function () {
      this.ipc.onMenuClicked.yield(null, 'log:out')

      expect(this.ipc.logOut).to.be.called
    })
  })
})
