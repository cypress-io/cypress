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

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setTimeout should not be called')
      .then(() => {
        win.bar = null

        const id2 = win.setTimeout(win.setBar, 2)

        expect(id2).to.eq(2)

        const ret = win.clearTimeout(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
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

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setInterval should not be called')
      .then(() => {
        win.clearInterval(id1)

        win.bar = null

        const id2 = win.setInterval(win.setBar, 2)

        expect(id2).to.eq(2)

        const ret = win.clearInterval(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
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
      .callsFake(() => {
        win.bar = 'bar'
      })

      // prevent timers from firing, add to queue
      cy.pauseTimers(true)

      const id1 = win.requestAnimationFrame(rafStub)

      expect(id1).to.eq(1)

      cy
      .wait(100)
      .log('requestAnimationFrame should NOT have fired when paused')
      .window().its('bar').should('be.null')
      .log('requestAnimationFrame should now fire when unpaused')
      .then(() => {
        // now go ahead and run all the queued timers
        cy.pauseTimers(false)

        expect(win.bar).to.eq('bar')

        // requestAnimationFrame should have passed through
        // its high res timestamp from performance.now()
        expect(rafStub).to.be.calledWithMatch(Number)
      })
      .then(() => {
        win.bar = 'foo'

        cy.pauseTimers(true)

        const id2 = win.requestAnimationFrame(rafStub)

        expect(id2).to.eq(2)

        const ret = win.cancelAnimationFrame(id2)

        expect(ret).to.be.undefined

        cy.pauseTimers(false)
      })
      .wait(100)
      .window().its('bar').should('eq', 'foo')
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
      cy.pauseTimers(true)

      const id1 = win.setTimeout(win.setBar, 1)

      expect(id1).to.eq(1)

      cy
      .wait(100)
      .log('setTimeout should NOT have fired when paused')
      .window().its('bar').should('be.null')
      .log('setTimeout should now fire when unpaused')
      .then(() => {
        // now go ahead and run all the queued timers
        cy.pauseTimers(false)

        expect(win.bar).to.eq('bar')
      })
      .then(() => {
        win.bar = 'foo'

        cy.pauseTimers(true)

        const id2 = win.setTimeout(win.setBar, 1)

        expect(id2).to.eq(2)

        const ret = win.clearTimeout(id2)

        expect(ret).to.be.undefined

        cy.pauseTimers(false)
      })
      .wait(100)
      .window().its('bar').should('eq', 'foo')
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

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy.pauseTimers(true)

      cy
      .wait(100)
      .window().its('bar').should('be.null')
      .log('setTimeout should be immediately flushed after unpausing')
      .then(() => {
        cy.pauseTimers(false)

        expect(win.bar).to.eq('bar')
      })
      .log('cancelling the timeout after timers are paused still cancels')
      .then(() => {
        win.bar = null

        const id2 = win.setInterval(win.setBar, 10)

        expect(id2).to.eq(2)

        cy.pauseTimers(true)

        // clearing interval on a timer is officially supported by browsers
        win.clearInterval(id2)
      })
      .wait(100)
      .window().its('bar').should('be.null')
    })
  })

  describe('accepts different types of timer function', () => {
    it('string', () => {
      cy
      .window()
      .then((win) => {
        win.stub = cy.stub()

        win.setTimeout('this.stub()', 1)

        cy
        .wait(10)
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

          cy
          .wait(10)
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
        cy.pauseTimers(false)

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

  it('does not fire queued timers if page transitions while paused', () => {
    // at least in chrome... whenever the page is unloaded
    // the browser WILL CANCEL outstanding macrotasks automatically
    // and invoking them does nothing
    cy
    .log('the browser should automatically cancel timers from unloaded windows')
    .window()
    .then((win) => {
      const stub1 = cy.stub()

      win.setTimeout(stub1, 200)

      win.location.reload()

      cy
      .wait(400)
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
