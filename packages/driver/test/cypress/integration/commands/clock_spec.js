describe('src/cy/commands/clock', () => {
  beforeEach(() => {
    this.window = cy.state('window')

    this.setTimeoutSpy = cy.spy(this.window, 'setTimeout')
    this.setIntervalSpy = cy.spy(this.window, 'setInterval')
  })

  describe('#clock', () => {
    it('sets clock as subject', () => {
      cy.clock().then((clock) => {
        expect(clock).to.exist

        expect(clock.tick).to.be.a('function')
      })
    })

    it('assigns clock to test context', () => {
      cy.clock().then(function (clock) {
        expect(clock).to.eq(this.clock)
      })
    })

    it('proxies lolex clock, replacing window time methods', function (done) {
      expect(this.setTimeoutSpy).not.to.be.called

      cy.clock().then(function (clock) {
        // lolex calls setTimeout once as part of its setup
        // but it shouldn't be called again by the @window.setTimeout()
        expect(this.setTimeoutSpy).to.be.calledOnce
        this.window.setTimeout(() => {
          expect(this.setTimeoutSpy).to.be.calledOnce

          done()
        })

        return clock.tick()
      })
    })

    it('takes now arg', () => {
      const now = 1111111111111

      cy.clock(now).then(function (clock) {
        expect(new this.window.Date().getTime()).to.equal(now)
        clock.tick(4321)

        expect(new this.window.Date().getTime()).to.equal(now + 4321)
      })
    })

    it('restores window time methods when calling restore', (done) => {
      cy.clock().then(function (clock) {
        this.window.setTimeout(() => {
          expect(this.setTimeoutSpy).to.be.calledOnce
          clock.restore()
          expect(this.window.setTimeout).to.equal(this.setTimeoutSpy)

          return this.window.setTimeout(() => {
            expect(this.setTimeoutSpy).to.be.calledTwice

            done()
          })
        })

        return clock.tick()
      })
    })

    it('unsets clock after restore', () => {
      cy.clock().then(function (clock) {
        expect(cy.state('clock')).to.exist
        clock.restore()
        expect(cy.state('clock')).to.be.null

        expect(this.clock).to.be.null
      })
    })

    it('automatically restores clock on \'restore\' event', () => {
      cy.clock().then((clock) => {
        const r = cy.spy(clock, 'restore')

        Cypress.emit('test:before:run', {})

        expect(r).to.be.called
      })
    })

    it('returns clock on subsequent calls, ignoring arguments', () => {
      cy
      .clock()
      .clock(400)
      .then((clock) => expect(clock.details().now).to.equal(0))
    })

    it('new Date() is an instance of Date', () => {
      cy.clock()

      cy.window().then((win) => {
        expect(new win.Date()).to.be.an.instanceof(win.Date)

        expect(new win.Date() instanceof win.Date).to.be.true
      })
    })

    // this test was written to catch a bug in lolex (dep) 3 and is fixed by lolex 4 upgrade,
    it('doesn\'t override window.performance members', () => {
      cy.clock()
      .then((clock) => {
        cy.window().then((win) => {
          expect(win.performance.getEntries()).to.deep.eq([])
          clock.restore()

          expect(win.performance.getEntries().length).to.be.at.least(1)
        })
      })
    })

    context('errors', () => {
      it('throws if now is not a number (or options object)', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.clock()` only accepts a number or an `options` object for its first argument. You passed: `"250"`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/clock')

          done()
        })

        cy.clock('250')
      })

      it('throws if methods is not an array (or options object)', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.clock()` only accepts an array of function names or an `options` object for its second argument. You passed: `"setTimeout"`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/clock')

          done()
        })

        cy.clock(0, 'setTimeout')
      })

      it('throws if methods is not an array of strings (or options object)', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.clock()` only accepts an array of function names or an `options` object for its second argument. You passed: `[42]`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/clock')

          done()
        })

        cy.clock(0, [42])
      })
    })

    context('arg for which functions to replace', () => {
      it('replaces specified functions', (done) => {
        cy.clock(null, ['setTimeout']).then(function (clock) {
          this.window.setTimeout(() => {
            expect(this.setTimeoutSpy).to.be.calledOnce

            done()
          })

          return clock.tick()
        })
      })

      it('does not replace other functions', function (done) {
        cy.clock(null, ['setTimeout']).then((clock) => {
          let interval

          interval = this.window.setInterval(() => {
            this.window.clearInterval(interval)
            expect(this.setIntervalSpy).to.be.called
            this.window.setTimeout(() => {
              expect(this.setTimeoutSpy).to.be.calledOnce

              done()
            })

            return clock.tick()
          }
          , 5)
        })
      })
    })

    context('options', () => {
      beforeEach(() => {
        this.logged = false
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'clock') {
            this.logged = true
          }
        })

        return null
      })

      it('can be first arg', () => {
        cy.clock({ log: false }).then(() => {
          expect(this.logged).to.be.false
        })
      })

      it('can be second arg', () => {
        cy.clock(new Date().getTime(), { log: false }).then(() => {
          expect(this.logged).to.be.false
        })
      })

      it('can be third arg', () => {
        cy.clock(new Date().getTime(), ['setTimeout'], { log: false }).then(() => {
          expect(this.logged).to.be.false
        })
      })
    })

    context('window changes', () => {
      it('binds to default window before visit', () => {
        cy.clock(null, ['setTimeout']).then((clock) => {
          const onSetTimeout = cy.spy()

          cy.state('window').setTimeout(onSetTimeout)
          clock.tick()

          expect(onSetTimeout).to.be.called
        })
      })

      it('re-binds to new window when window changes', () => {
        const newWindow = {
          setTimeout () {},
          clearTimeout () {},
          Date () {},
          XMLHttpRequest: {
            prototype: {},
          },
        }

        cy.clock(null, ['setTimeout']).then((clock) => {
          Cypress.emit('window:before:load', newWindow)
          const onSetTimeout = cy.spy()

          newWindow.setTimeout(onSetTimeout)
          clock.tick()

          expect(onSetTimeout).to.be.called
        })
      })

      it('binds to window if called before visit', () => {
        cy.clock()

        cy.visit('/fixtures/dom.html')
      })
    }) // should not throw

    context('logging', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          const name = log.get('name')

          if (['clock', 'tick', 'restore'].includes(name)) {
            return this.logs.push(log)
          }
        })

        return null
      })

      it('logs when created', () => {
        cy.clock().then(() => {
          const log = this.logs[0]

          expect(this.logs.length).to.equal(1)
          expect(log.get('name')).to.eq('clock')
          expect(log.get('message')).to.eq('')
          expect(log.get('type')).to.eq('parent')
          expect(log.get('state')).to.eq('passed')
          expect(log.get('snapshots').length).to.eq(1)

          expect(log.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs when restored', () => {
        cy.clock().then((clock) => {
          clock.restore()

          const log = this.logs[1]

          expect(this.logs.length).to.equal(2)
          expect(log.get('name')).to.eq('restore')

          expect(log.get('message')).to.eq('')
        })
      })

      it('does not log when auto-restored', function (done) {
        cy.clock().then(() => {
          Cypress.emit('test:before:run', {})
          expect(this.logs.length).to.equal(1)

          done()
        })
      })

      it('does not log when log: false', () => {
        cy.clock({ log: false }).then((clock) => {
          clock.tick()
          clock.restore()

          expect(this.logs.length).to.equal(0)
        })
      })

      it('only logs the first call', () => {
        cy
        .clock()
        .clock()
        .clock()
        .then(() => {
          expect(this.logs.length).to.equal(1)
        })
      })

      context('#consoleProps', () => {
        beforeEach(() => {
          cy.clock(100, ['setTimeout']).then(function (clock) {
            this.clock = clock

            return this.clock.tick(100)
          })
        })

        it('includes clock\'s now value', () => {
          const consoleProps = this.logs[0].invoke('consoleProps')

          expect(consoleProps['Now']).to.equal(100)
        })

        it('includes methods replaced by clock', () => {
          const consoleProps = this.logs[0].invoke('consoleProps')

          expect(consoleProps['Methods replaced']).to.eql(['setTimeout'])
        })

        it('logs ticked amount on tick', () => {
          const createdConsoleProps = this.logs[0].invoke('consoleProps')

          expect(createdConsoleProps['Ticked']).to.be.undefined
          const tickedConsoleProps = this.logs[1].invoke('consoleProps')

          expect(tickedConsoleProps['Ticked']).to.equal('100 milliseconds')
        })

        it('properties are unaffected by future actions', () => {
          this.clock.tick(100)
          this.clock.restore()
          const consoleProps = this.logs[1].invoke('consoleProps')

          expect(consoleProps['Now']).to.equal(200)

          expect(consoleProps['Methods replaced']).to.eql(['setTimeout'])
        })
      })
    })
  })

  describe('#tick', () => {
    beforeEach(() => {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (log.get('name') === 'tick') {
          return this.logs.push(log)
        }
      })

      return null
    })

    it('moves time ahead and triggers callbacks', function (done) {
      cy
      .clock()
      .then(() => {
        return this.window.setTimeout(() => done()
          , 1000)
      }).tick(1000)
    })

    it('returns the clock object', () => {
      cy
      .clock()
      .tick(1000).then(function (clock) {
        expect(clock).to.equal(this.clock)
      })
    })

    it('defaults to 0ms', () => {
      cy.clock()
      .tick().then(function (clock) {
        const consoleProps = this.logs[0].invoke('consoleProps')

        expect(consoleProps['Ticked']).to.equal('0 milliseconds')
      })
    })

    context('errors', () => {
      it('throws if there is not a clock', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.tick()` cannot be called without first calling `cy.clock()`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/tick')

          done()
        })

        cy.tick()
      })

      it('throws if ms is not undefined or a number', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`clock.tick()`/`cy.tick()` only accepts a number as their argument. You passed: `"100"`')
          expect(err.docsUrl).to.equal('https://on.cypress.io/tick')

          done()
        })

        cy.clock().tick('100')
      })
    })

    context('logging', () => {
      it('logs number of milliseconds', () => {
        cy
        .clock()
        .tick(250)
        .then(() => {
          const log = this.logs[0]

          expect(this.logs.length).to.equal(1)
          expect(log.get('name')).to.eq('tick')

          expect(log.get('message')).to.eq('250ms')
        })
      })

      it('logs before and after snapshots', () => {
        cy
        .clock()
        .tick(250)
        .then(() => {
          const log = this.logs[0]

          expect(log.get('snapshots').length).to.eq(2)
          expect(log.get('snapshots')[0].name).to.equal('before')

          expect(log.get('snapshots')[1].name).to.equal('after')
        })
      })
    })
  })
})
