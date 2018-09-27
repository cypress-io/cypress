describe('issue #2432', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it('setTimeout is called through', () => {
    cy
    .log('setTimeout should be called')
    .window()
    .then((win) => {
      win.foo = () => {
        win.bar = 'bar'
      }

      const id1 = win.setTimeout(win.foo, 1)

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setTimeout should not be called')
      .then(() => {
        win.bar = null

        const id2 = win.setTimeout(win.foo, 2)

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
      win.foo = () => {
        win.bar = 'bar'
      }

      const id1 = win.setInterval(win.foo, 1)

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('setInterval should not be called')
      .then(() => {
        win.clearInterval(id1)

        win.bar = null

        const id2 = win.setInterval(win.foo, 2)

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
      win.foo = () => {
        win.bar = 'bar'
      }

      const id1 = win.requestAnimationFrame(win.foo, 1)

      // the timer id is 1 by default since
      // timers increment and always start at 0
      expect(id1).to.eq(1)

      cy
      .window().its('bar').should('eq', 'bar')
      .log('requestAnimationFrame should not be called')
      .then(() => {
        win.bar = null

        const id2 = win.requestAnimationFrame(win.foo, 2)

        expect(id2).to.eq(2)

        const ret = win.cancelAnimationFrame(id2)

        expect(ret).to.be.undefined
      })
      .wait(100)
      .window().its('bar').should('be.null')
    })
  })

  it('delays calls to setTimeout when paused', () => {
    cy
    .window()
    .then((win) => {
      win.bar = null

      win.foo = () => {
        win.bar = 'bar'
      }

      // prevent timers from firing, add to queue
      cy.pauseTimers(true)

      const id1 = win.setTimeout(win.foo, 1)

      expect(id1).to.eq(1)

      // timers are paused, id10 = setTimeout()
      // clearTimeout(id10)
      // timers are unpaused, id11 = theRealTimeout()

      // this is a valid use case and must be handled correctly!!!!
      // const id1 = setInterval(() => {
      //   clearInterval(id1)
      // }, 1000)

      // const id2 = setTimeout(() => {
      // }, 1000)

      // Promise.delay(2000).then(() => {
      //   clearTimeout(id2)
      // })

      // setTimeout
      // delay
      // clearTimeout

      // when paused
      // setTimeout 1s (queued)
      // delay 2s
      // in reality the SS takes 5s
      // clearTimeout (wipes out setTimeout)
      // normally this WOULD NOT clear but does clear when paused

      cy
      .wait(100)
      .log('setTimeout should NOT have fired when paused')
      .window().its('bar').should('be.null')
      .then(() => {
        // now go ahead and run all the queued timers
        cy.pauseTimers(false)
      })
      .log('setTimeout should now fire when unpaused')
      .window().its('bar').should('eq', 'bar')
      .then(() => {
        win.bar = 'foo'

        cy.pauseTimers(true)

        const id2 = win.setTimeout(win.foo, 1)

        expect(id2).to.eq(2)

        const ret = win.clearTimeout(id2)

        expect(ret).to.be.undefined

        cy.pauseTimers(false)
      })
      .wait(100)
      .window().its('bar').should('eq', 'foo')
    })
  })

  it('delays calls to setInterval when paused', () => {
    cy
    .window()
    .then((win) => {
      win.bar = null

      win.foo = () => {
        win.bar = 'bar'
      }

      // prevent timers from firing, add to queue
      cy.pauseTimers(true)

      const id1 = win.setInterval(win.foo, 1)

      expect(id1).to.eq(1)

      cy
      .wait(100)
      .log('setInterval should NOT have fired when paused')
      .window().its('bar').should('be.null')
      .then(() => {
        // now go ahead and run all the queued timers
        cy.pauseTimers(false)
      })
      .log('setInterval should now fire when unpaused')
      .window().its('bar').should('eq', 'bar')
    })
  })
})
