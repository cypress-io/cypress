import { findCrossOriginLogs } from '../../../../support/utils'

/**
 * Spec-bridge agent log names are `spy-1`, `spy-2`, … depending on order since the last sandbox reset.
 * Pick the agent instrument log and its matching invoke event log for assertions.
 */
function findAgentInstrumentAndEventLogs (
  logMap: Map<string, any>,
  namePattern: RegExp,
  matchingOrigin: string,
) {
  const propsList = Array.from(logMap.values()).map((log: any) => log.get()).filter((props: any) => {
    return namePattern.test(props.name) && props.id.includes(matchingOrigin)
  })

  const agentLog = propsList.find((p) => p.instrument === 'agent')
  const eventLog = propsList.find((p) => p.event === true && agentLog && p.name === agentLog.name)

  return [agentLog, eventLog]
}

context('cy.origin spies, stubs, and clock', { browser: '!webkit' }, () => {
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
        const expose = Cypress.expose as unknown as { restore?: () => void }

        if (typeof expose?.restore === 'function') {
          expose.restore()
        }

        const stubExpose = cy.stub(Cypress, 'expose').withArgs('foo').returns('bar')

        expect(Cypress.expose('foo')).to.equal('bar')
        expect(stubExpose).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.expose.isSinonProxy).to.be.true

        const stubbedExpose = Cypress.expose as unknown as { restore?: () => void }

        if (typeof stubbedExpose?.restore === 'function') {
          stubbedExpose.restore()
        }
      })
    })

    it('verifies the stub got restored', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        expect(Cypress.expose('foo')).to.be.undefined
        // @ts-ignore
        expect(Cypress.expose.isSinonProxy).to.be.undefined
      })
    })
  })

  context('resets spies', () => {
    it('creates the spy', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const expose = Cypress.expose as unknown as { restore?: () => void }

        if (typeof expose?.restore === 'function') {
          expose.restore()
        }

        const stubExpose = cy.spy(Cypress, 'expose')

        Cypress.expose()
        expect(stubExpose).to.be.calledOnce
        // @ts-ignore
        expect(Cypress.expose.isSinonProxy).to.be.true

        const spiedExpose = Cypress.expose as unknown as { restore?: () => void }

        if (typeof spiedExpose?.restore === 'function') {
          spiedExpose.restore()
        }
      })
    })

    it('verifies the spy got restored', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        expect(Cypress.expose.isSinonProxy).to.be.undefined
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
        const [spyLog, spyEvent] = findAgentInstrumentAndEventLogs(logs, /^spy-\d+$/, 'foobar.com')

        expect(spyLog?.instrument).to.equal('agent')
        expect(spyLog?.callCount).to.be.a('number')
        expect(spyLog?.functionName).to.equal('bar')

        expect(spyEvent?.instrument).to.equal('command')

        const consoleProps = spyEvent.consoleProps()

        expect(consoleProps.name).to.equal(`${spyLog?.name} called`)
        expect(consoleProps.type).to.equal('event')
        expect(consoleProps.props).to.have.property('Alias', undefined)
        expect(consoleProps.props).to.have.property('Arguments')
        expect(consoleProps.props).to.have.property('Call #', 1)
        expect(consoleProps.props).to.have.property('Returned', undefined)
        expect(consoleProps.props).to.have.property('Spied Obj')
        expect(consoleProps.props).to.have.property('spy', null)
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
        const [stubLog, stubEvent] = findAgentInstrumentAndEventLogs(logs, /^stub-\d+$/, 'foobar.com')

        expect(stubLog?.instrument).to.equal('agent')
        expect(stubLog?.callCount).to.be.a('number')
        expect(stubLog?.functionName).to.equal('bar')

        expect(stubEvent?.instrument).to.equal('command')
        const consoleProps = stubEvent.consoleProps()

        expect(consoleProps.name).to.equal(`${stubLog?.name} called`)
        expect(consoleProps.type).to.equal('event')
        expect(consoleProps.props).to.have.property('Alias', undefined)
        expect(consoleProps.props).to.have.property('Arguments')
        expect(consoleProps.props).to.have.property('Context')
        expect(consoleProps.props).to.have.property('Call #', 1)
        expect(consoleProps.props).to.have.property('Returned', undefined)
        expect(consoleProps.props).to.have.property('Stubbed Obj')
        expect(consoleProps.props).to.have.property('stub', null)
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

        const consoleProps = clockLog.consoleProps

        expect(consoleProps.name).to.equal('clock')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps.props).to.have.property('Now').that.is.a('number')
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

        const consoleProps = Cypress._.isFunction(tickLog.consoleProps) ? tickLog.consoleProps() : tickLog.consoleProps

        expect(consoleProps.name).to.equal('tick')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps.props).to.have.property('Now').that.is.a('number')
        expect(consoleProps.props).to.have.property('Ticked').that.is.a('string')
      })
    })
  })
})
