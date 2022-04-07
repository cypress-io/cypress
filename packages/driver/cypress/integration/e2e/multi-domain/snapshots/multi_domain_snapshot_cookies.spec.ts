import _ from 'lodash'
import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot cookies', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.clearCookies()
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.getCookie()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('getCookie', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('getCookie')
        expect(consoleProps.Yielded).to.have.property('domain').that.includes('foobar.com')
        expect(consoleProps.Yielded).to.have.property('expiry').that.is.a('number')
        expect(consoleProps.Yielded).to.have.property('httpOnly').that.equals(false)
        expect(consoleProps.Yielded).to.have.property('secure').that.equals(false)
        expect(consoleProps.Yielded).to.have.property('name').that.equals('foo')
        expect(consoleProps.Yielded).to.have.property('value').that.equals('bar')
        expect(consoleProps.Yielded).to.have.property('path').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.getCookies().should('be.empty')
      cy.setCookie('foo', 'bar')
      cy.getCookie('foo')
    })
  })

  it('.getCookies()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        // get the last 'getCookies' command, which is the one we care about for this test
        const allGetCookieLogs = findCrossOriginLogs('getCookies', logs, 'foobar.com')

        const { crossOriginLog, consoleProps } = allGetCookieLogs.pop() as any

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('getCookies')
        expect(consoleProps['Num Cookies']).to.equal(1)

        // can't exactly assert on length() as this is a array proxy object
        expect(consoleProps.Yielded.length).to.equal(1)
        expect(consoleProps.Yielded[0]).to.have.property('expiry').that.is.a('number')
        expect(consoleProps.Yielded[0]).to.have.property('httpOnly').that.equals(false)
        expect(consoleProps.Yielded[0]).to.have.property('secure').that.equals(false)
        expect(consoleProps.Yielded[0]).to.have.property('name').that.equals('foo')
        expect(consoleProps.Yielded[0]).to.have.property('value').that.equals('bar')
        expect(consoleProps.Yielded[0]).to.have.property('path').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.getCookies().should('be.empty')

      cy.setCookie('foo', 'bar')
      cy.getCookies()
    })
  })

  it('.setCookie()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('setCookie', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('setCookie')
        expect(consoleProps.Yielded).to.have.property('domain').that.includes('foobar.com')
        expect(consoleProps.Yielded).to.have.property('expiry').that.is.a('number')
        expect(consoleProps.Yielded).to.have.property('httpOnly').that.equals(false)
        expect(consoleProps.Yielded).to.have.property('secure').that.equals(false)
        expect(consoleProps.Yielded).to.have.property('name').that.equals('foo')
        expect(consoleProps.Yielded).to.have.property('value').that.equals('bar')
        expect(consoleProps.Yielded).to.have.property('path').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.getCookies().should('be.empty')

      cy.setCookie('foo', 'bar')
    })
  })

  it('.clearCookie()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('clearCookie', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('clearCookie')
        expect(consoleProps.Yielded).to.equal('null')
        expect(consoleProps['Cleared Cookie']).to.have.property('domain').that.includes('foobar.com')
        expect(consoleProps['Cleared Cookie']).to.have.property('expiry').that.is.a('number')
        expect(consoleProps['Cleared Cookie']).to.have.property('httpOnly').that.equals(false)
        expect(consoleProps['Cleared Cookie']).to.have.property('secure').that.equals(false)
        expect(consoleProps['Cleared Cookie']).to.have.property('name').that.equals('foo')
        expect(consoleProps['Cleared Cookie']).to.have.property('value').that.equals('bar')
        expect(consoleProps['Cleared Cookie']).to.have.property('path').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.setCookie('foo', 'bar')
      cy.getCookie('foo').should('not.be.null')
      cy.clearCookie('foo')
    })
  })

  it('.clearCookies()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('clearCookies', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('clearCookies')
        expect(consoleProps['Num Cookies']).to.equal(2)

        expect(consoleProps.Yielded).to.equal('null')

        expect(consoleProps['Cleared Cookies'].length).to.equal(2)

        expect(consoleProps['Cleared Cookies'][0]).to.have.property('name').that.equals('foo')
        expect(consoleProps['Cleared Cookies'][0]).to.have.property('value').that.equals('bar')

        expect(consoleProps['Cleared Cookies'][1]).to.have.property('name').that.equals('faz')
        expect(consoleProps['Cleared Cookies'][1]).to.have.property('value').that.equals('baz')

        _.forEach(consoleProps['Cleared Cookies'], (clearedCookie) => {
          expect(clearedCookie).to.have.property('httpOnly').that.equals(false)
          expect(clearedCookie).to.have.property('secure').that.equals(false)
          expect(clearedCookie).to.have.property('path').that.is.a('string')
        })

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.setCookie('foo', 'bar')
      cy.setCookie('faz', 'baz')

      cy.getCookies().should('have.length', 2)
      cy.clearCookies()
    })
  })
})
