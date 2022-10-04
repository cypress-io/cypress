import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin spies, stubs, and clock', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('spy()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const foo = { bar () { } }

      cy.spy(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  it('stub()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const foo = { bar () { } }

      cy.stub(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  context('resets stubs', () => {
    it('creates the stub', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const stubEnv = cy.stub(Cypress, 'env').withArgs('foo').returns('bar')

        expect(Cypress.env('foo')).to.equal('bar')
        expect(stubEnv).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.true
      })
    })

    it('verifies the stub got restored', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        expect(Cypress.env('foo')).to.be.undefined
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.undefined
      })
    })
  })

  context('resets spies', () => {
    it('creates the spy', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const stubEnv = cy.spy(Cypress, 'env')

        Cypress.env()
        expect(stubEnv).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.true
      })
    })

    it('verifies the spy got restored', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        expect(Cypress.env.isSinonProxy).to.be.undefined
      })
    })
  })

  it('clock() and tick()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const now = Date.UTC(2022, 0, 12)

      cy.clock(now)
      cy.window().then((win) => {
        expect(win.Date.now()).to.equal(now)
      })

      cy.tick(10000) // 10 seconds passed
      cy.window().then((win) => {
        expect(win.Date.now()).to.equal(now + 10000)
      })
    })
  })

  context('#consoleProps', () => {
    const { _ } = Cypress
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      // cy.clock only adds a log and does NOT update
      cy.on('log:added', (attrs, log) => {
        logs.set(attrs.id, log)
      })

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('spy()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const foo = { bar () { } }

        cy.spy(foo, 'bar')
        foo.bar()
        expect(foo.bar).to.be.called
      })

      cy.shouldWithTimeout(() => {
        const spyLog = findCrossOriginLogs('spy-1', logs, 'foobar.com')

        expect(spyLog.consoleProps.Command).to.equal('spy-1')
        expect(spyLog.callCount).to.be.a('number')
        expect(spyLog.functionName).to.equal('bar')
      })
    })

    it('.stub()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const foo = { bar () { } }

        cy.stub(foo, 'bar')
        foo.bar()
        expect(foo.bar).to.be.called
      })

      cy.shouldWithTimeout(() => {
        const stubLog = findCrossOriginLogs('stub-1', logs, 'foobar.com')

        expect(stubLog.consoleProps.Command).to.equal('stub-1')
        expect(stubLog.callCount).to.be.a('number')
        expect(stubLog.functionName).to.equal('bar')
      })
    })

    it('.clock()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const now = Date.UTC(2022, 0, 12)

        cy.clock(now)
      })

      cy.shouldWithTimeout(() => {
        const clockLog = findCrossOriginLogs('clock', logs, 'foobar.com')

        expect(clockLog.name).to.equal('clock')

        const consoleProps = clockLog.consoleProps()

        expect(consoleProps.Command).to.equal('clock')
        expect(consoleProps).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps).to.have.property('Now').that.is.a('number')
      })
    })

    it('.tick()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const now = Date.UTC(2022, 0, 12)

        cy.clock(now)

        cy.tick(10000)
      })

      cy.shouldWithTimeout(() => {
        const tickLog = findCrossOriginLogs('tick', logs, 'foobar.com')

        expect(tickLog.name).to.equal('tick')

        const consoleProps = _.isFunction(tickLog.consoleProps) ? tickLog.consoleProps() : tickLog.consoleProps

        expect(consoleProps.Command).to.equal('tick')
        expect(consoleProps).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps).to.have.property('Now').that.is.a('number')
        expect(consoleProps).to.have.property('Ticked').that.is.a('string')
      })
    })
  })
})
