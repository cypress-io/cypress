// NOTE: basically the same as a cy.wait(...) but uses setTimeout instead of Promise.delay
// since firefox will sometimes have `Promise.delay(10)` fire faster than a `setTimeout(..., 1)`
const cyWaitTimeout = (n) => cy.wrap(new Promise((resolve) => window.setTimeout(resolve, n)))

describe('driver/src/cy/timers', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it('setTimeout is called through', () => {
    cy
    .log('setTimeout should be called')
    .window()
    .then((win) => {
      win.setBar = () => {
        win.bar = 'bar'
      }

      const id1 = win.setTimeout(win.setBar, 1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setTimeout should not be called')
      .then(() => {
        win.bar = null

        const id2 = win.setTimeout(win.setBar, 2)

        expect(id2).to.eq(id1 + 1)

        const ret = win.clearTimeout(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
    })
  })

  it('setTimeout can pass multiple parameters to the target function', () => {
    cy
    .log('setTimeout should call target with two parameters')
    .window()
    .then((win) => {
      win.foo = null
      win.setFoo = (bar, baz) => {
        win.foo = bar + baz
      }

      win.setTimeout(win.setFoo, 0, 'bar', 'baz')

      cy
      .window().its('foo').should('eq', 'barbaz')
    })
  })

  it('setInterval is called through', () => {
    cy
    .log('setInterval should be called')
    .window()
    .then((win) => {
      win.setBar = () => {
        win.bar = 'bar'
      }

      const id1 = win.setInterval(win.setBar, 1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setInterval should not be called')
      .then(() => {
        win.clearInterval(id1)

        win.bar = null

        const id2 = win.setInterval(win.setBar, 2)

        expect(id2).to.eq(id1 + 1)

        const ret = win.clearInterval(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
    })
  })

  it('setInterval can pass multiple parameters to the target function', () => {
    cy
    .log('setInterval should call target with two parameters')
    .window()
    .then((win) => {
      win.foo = null
      win.setFoo = (bar, baz) => {
        win.foo = bar + baz
      }

      const id1 = win.setInterval(win.setFoo, 1, 'bar', 'baz')

      cy
      .window().its('foo').should('eq', 'barbaz')
      .then(() => {
        win.clearInterval(id1)
      })
    })
  })

  it('requestAnimationFrame is called through', () => {
    cy
    .log('requestAnimationFrame should be called')
    .window()
    .then((win) => {
      const rafStub = cy
      .stub()
      .callsFake(() => {
        win.bar = 'bar'
      })

      const id1 = win.requestAnimationFrame(rafStub, 'foo', 'bar', 'baz')

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('requestAnimationFrame should not be called')
      .then(() => {
        // requestAnimationFrame should have passed through
        // its high res timestamp from performance.now()
        expect(rafStub).to.be.calledWithMatch(Number)
        expect(rafStub.firstCall.args.length).to.eq(1)

        win.bar = null

        const id2 = win.requestAnimationFrame(rafStub)

        expect(id2).to.eq(2)

        const ret = win.cancelAnimationFrame(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
    })
  })

  it('delays calls to requestAnimationFrame when paused', () => {
    cy
    .window()
    .then((win) => {
      win.bar = null

      const rafStub = cy
      .stub()
      .callsFake((arg) => {
        win.bar = 'bar'
      })

      // prevent timers from firing, add to queue
      return cy.pauseTimers(true)
      .then(() => {
        const id1 = win.requestAnimationFrame(rafStub)

        expect(id1).to.eq(1)

        cy
        .wait(100)
        .log('requestAnimationFrame should NOT have fired when paused')
        .window().its('bar').should('be.null')
        .log('requestAnimationFrame should now fire when unpaused')
        .then(() => {
          // now go ahead and run all the queued timers
          return cy.pauseTimers(false)
        })

        cy.window().its('bar').should('eq', 'bar')
        .and(() => {
          // requestAnimationFrame should have passed through
          // its high res timestamp from performance.now()
          expect(rafStub).to.be.calledWithMatch(Number)
        })
        .then(() => {
          win.bar = 'foo'

          return cy.pauseTimers(true)
        })
        .then(() => {
          const id2 = win.requestAnimationFrame(rafStub)

          expect(id2).to.eq(2)

          const ret = win.cancelAnimationFrame(id2)

          expect(ret).to.be.undefined

          return cy.pauseTimers(false)
        })
        .wait(100)
        .window().its('bar').should('eq', 'foo')
      })
    })
  })

  it('delays calls to setTimeout when paused', () => {
    cy
    .window()
    .then((win) => {
      win.bar = null

      win.setBar = () => {
        win.bar = 'bar'
      }

      // prevent timers from firing, add to queue
      return cy.pauseTimers(true)
      .then(() => {
        const id1 = win.setTimeout(win.setBar, 1)

        cyWaitTimeout(1)
        .log('setTimeout should NOT have fired when paused')
        .window().its('bar').should('be.null')
        .log('setTimeout should now fire when unpaused')
        .then(() => {
          // now go ahead and run all the queued timers
          return cy.pauseTimers(false)
        })
        .then(() => {
          expect(win.bar).to.eq('bar')
        })
        .then(() => {
          win.bar = 'foo'

          return cy.pauseTimers(true)
        })
        .then(() => {
          const id2 = win.setTimeout(win.setBar, 1)

          expect(id2).to.eq(id1 + 1)

          const ret = win.clearTimeout(id2)

          expect(ret).to.be.undefined

          return cy.pauseTimers(false)
        })

        cyWaitTimeout(1)
        .window().its('bar').should('eq', 'foo')
      })
    })
  })

  it('delays timers queued before pausing but have not fired yet', () => {
    cy
    .log('setTimeout should be delayed until timers have been unpaused')
    .window()
    .then((win) => {
      win.bar = null

      win.setBar = () => {
        win.bar = 'bar'
      }

      const id1 = win.setTimeout(win.setBar, 10)

      return cy.pauseTimers(true)
      .then(() => {
        cyWaitTimeout(10)

        cy.window().its('bar').should('be.null')
        .log('setTimeout should be immediately flushed after unpausing')
        .then(() => {
          return cy.pauseTimers(false)
        })
        .then(() => {
          expect(win.bar).to.eq('bar')
        })
        .log('canceling the timeout after timers are paused still cancels')
        .then(() => {
          win.bar = null

          const id2 = win.setInterval(win.setBar, 10)

          expect(id2).to.eq(id1 + 1)

          return cy.pauseTimers(true)
          .then(() => {
          // clearing interval on a timer is officially supported by browsers
            win.clearInterval(id2)
          })
        })
        .wait(100)
        .window().its('bar').should('be.null')
      })
    })
  })

  describe('accepts different types of timer function', () => {
    it('string', () => {
      cy
      .window()
      .then((win) => {
        win.stub = cy.stub()

        win.setTimeout('this.stub()', 1)

        cyWaitTimeout(1)
        .then(() => {
          expect(win.stub).to.be.called
        })
      })
    })

    const codes = [
      ['undefined', undefined],
      ['boolean', true],
      ['number', 42],
      ['array', []],
      ['object', {}],
    ]

    codes.forEach(([name, value]) => {
      it(name, () => {
        cy
        .window()
        .then((win) => {
          win.eval = cy.stub()
          win.setTimeout(value, 1)

          cyWaitTimeout(1)
          .then(() => {
            expect(win.eval).to.be.called
          })
        })
      })
    })
  })

  it('can cancel setIntervals paused or unpaused', () => {
    // 1. setInterval works unpaused and can be canceled after N calls
    // 2. setInterval stops invoking when paused and when resumed invokes all paused calls

    cy
    .log('cancels the interval after 3 calls')
    .window()
    .then((win) => {
      let timerId

      const cancelAfter3Calls = cy
      .stub()
      .onThirdCall()
      .callsFake(() => {
        win.clearInterval(timerId)
      })

      timerId = win.setInterval(cancelAfter3Calls, 10)

      cy
      .wait(100)
      .then(() => {
        expect(cancelAfter3Calls).to.be.calledThrice
      })
    })
    .log('cancels the interval after 3 calls even when paused')
    .window()
    .then((win) => {
      let timerId

      const cancelAfter3Calls = cy
      .stub()
      .onThirdCall()
      .callsFake(() => {
        // this tests that we're properly overloading clearTimeouts to clear intervals
        // because this is official supported by all browsers
        // clearTimeout(N)
        // clearInterval(N) yup same thing all good
        win.clearTimeout(timerId)
      })

      cy.pauseTimers(true)

      timerId = win.setInterval(cancelAfter3Calls, 10)

      cy
      .wait(200)
      .then(() => {
        return cy.pauseTimers(false)
      })
      .then(() => {
        expect(cancelAfter3Calls).to.be.calledThrice
      })
    })

    //
    // setInterval(cb, 100)
    // cb() 100
    // cb() 200
    // cb() 300 <-- cancel
    //
    // when paused...
    // setInterval(cb, 100)
    // cb() 100
    // cb() 200
    // cb() 300 <-- would normally cancel callback but didn't because of pause
    // cb() 400 <-- return early, do not call
    // cb() 500 <-- return early, do not call
    // cb() 600 <-- return early, do not call
    // ...
    //
  })

  // TODO(webkit): fix+unskip
  it('does not fire queued timers if page transitions while paused', { browser: '!webkit' }, () => {
    // at least in chrome... whenever the page is unloaded
    // the browser WILL CANCEL outstanding macrotasks automatically
    // and invoking them does nothing
    cy
    .log('the browser should automatically cancel timers from unloaded windows')
    .window()
    .then((win) => {
      const stub1 = cy.stub()

      // we're setting setTimeout to 500ms because
      // there were times where the driver's webserver
      // was sending bytes after 200ms (TTFB) that caused
      // this test to be flaky.
      win.setTimeout(stub1, 500)

      // force the window to sync reload
      win.location.reload()

      cy
      .wait(800)
      .then(() => {
        expect(stub1).not.to.be.called
      })
      .log('queued timers are not called on unloaded windows')
      .window()
      .then((win) => {
        const stub2 = cy.stub()

        cy.pauseTimers(true)

        win.setTimeout(stub2, 10)

        cy
        .wait(100)
        .then(() => {
          expect(stub2).not.to.be.called
        })
        .reload()
        .then(() => {
          cy.pauseTimers(false)

          expect(stub2).not.to.be.called
        })
      })
    })
  })
})
