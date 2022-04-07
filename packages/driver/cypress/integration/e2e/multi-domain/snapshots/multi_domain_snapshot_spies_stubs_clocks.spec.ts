import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot spies, stubs, and clock', { experimentalSessionSupport: true }, () => {
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

    cy.clearCookies()
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('spy()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const spyLog = findCrossOriginLogs('spy-1', logs, 'foobar.com')

        expect(spyLog.crossOriginLog).to.be.true
        expect(spyLog.consoleProps.Command).to.equal('spy-1')
        expect(spyLog.callCount).to.be.a('number')
        expect(spyLog.functionName).to.equal('bar')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      const foo = { bar () { } }

      cy.spy(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  it('.stub()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const stubLog = findCrossOriginLogs('stub-1', logs, 'foobar.com')

        expect(stubLog.crossOriginLog).to.be.true
        expect(stubLog.consoleProps.Command).to.equal('stub-1')
        expect(stubLog.callCount).to.be.a('number')
        expect(stubLog.functionName).to.equal('bar')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      const foo = { bar () { } }

      cy.stub(foo, 'bar')
      foo.bar()
      expect(foo.bar).to.be.called
    })
  })

  it('.clock()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const clockLog = findCrossOriginLogs('clock', logs, 'foobar.com')

        expect(clockLog.crossOriginLog).to.be.true
        expect(clockLog.name).to.equal('clock')

        const consoleProps = clockLog.consoleProps()

        expect(consoleProps.Command).to.equal('clock')
        expect(consoleProps).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps).to.have.property('Now').that.is.a('number')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      const now = Date.UTC(2022, 0, 12)

      cy.clock(now)
    })
  })

  it('.tick()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const tickLog = findCrossOriginLogs('tick', logs, 'foobar.com')

        expect(tickLog.crossOriginLog).to.be.true
        expect(tickLog.name).to.equal('tick')

        const consoleProps = tickLog.consoleProps

        expect(consoleProps.Command).to.equal('tick')
        expect(consoleProps).to.have.property('Methods replaced').that.is.a('object')
        expect(consoleProps).to.have.property('Now').that.is.a('number')
        expect(consoleProps).to.have.property('Ticked').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      const now = Date.UTC(2022, 0, 12)

      cy.clock(now)

      cy.tick(10000)
    })
  })
})
