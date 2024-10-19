import { findCrossOriginLogs, assertLogLength } from '../../../../support/utils'

describe('cy.origin cookies', { browser: '!webkit' }, () => {
  context('client side', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('.getCookie(), .getCookies(), and .setCookie()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.getCookies().should('be.empty')

        cy.setCookie('foo', 'bar')

        cy.getCookie('foo').should('have.property', 'value', 'bar')
        cy.getCookies().should('have.length', 1)
      })
    })

    it('.clearCookie()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.setCookie('foo', 'bar')
        cy.getCookie('foo').should('not.be.null')
        cy.clearCookie('foo')
        cy.getCookie('foo').should('be.null')
      })
    })

    it('.clearCookies()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.setCookie('foo', 'bar')
        cy.setCookie('faz', 'baz')

        cy.getCookies().should('have.length', 2)
        cy.clearCookies()
        cy.getCookies().should('be.empty')
      })
    })

    context('cross-origin AUT errors', () => {
      let logs: any = []

      beforeEach(() => {
        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })
      })

      afterEach(() => {
        logs = []
      })

      it('.getCookie()', { defaultCommandTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          assertLogLength(logs, 1)
          expect(logs[0].get('error')).to.eq(err)
          expect(logs[0].get('state')).to.eq('failed')
          expect(logs[0].get('name')).to.eq('getCookie')
          expect(logs[0].get('message')).to.eq('foo')
          expect(err.message).to.include('Timed out retrying after 100ms: The command was expected to run against origin `http://localhost:3500` but the application is at origin `http://www.foobar.com:3500`.\n\nThis commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')

          done()
        })

        cy.getCookie('foo')
      })

      it('.getCookies()', { defaultCommandTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          assertLogLength(logs, 1)
          expect(logs[0].get('error')).to.eq(err)
          expect(logs[0].get('state')).to.eq('failed')
          expect(logs[0].get('name')).to.eq('getCookies')
          expect(logs[0].get('message')).to.eq('')
          expect(err.message).to.include('Timed out retrying after 100ms: The command was expected to run against origin `http://localhost:3500` but the application is at origin `http://www.foobar.com:3500`.\n\nThis commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')

          done()
        })

        cy.getCookies()
      })

      it('.setCookie()', { defaultCommandTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          assertLogLength(logs, 1)
          expect(logs[0].get('error')).to.eq(err)
          expect(logs[0].get('state')).to.eq('failed')
          expect(logs[0].get('name')).to.eq('setCookie')
          expect(logs[0].get('message')).to.eq('foo, bar')
          expect(err.message).to.include('Timed out retrying after 100ms: The command was expected to run against origin `http://localhost:3500` but the application is at origin `http://www.foobar.com:3500`.\n\nThis commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')

          done()
        })

        cy.setCookie('foo', 'bar')
      })

      it('.clearCookie()', { defaultCommandTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          assertLogLength(logs, 1)
          expect(logs[0].get('error')).to.eq(err)
          expect(logs[0].get('state')).to.eq('failed')
          expect(logs[0].get('name')).to.eq('clearCookie')
          expect(logs[0].get('message')).to.eq('foo')
          expect(err.message).to.include('Timed out retrying after 100ms: The command was expected to run against origin `http://localhost:3500` but the application is at origin `http://www.foobar.com:3500`.\n\nThis commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')

          done()
        })

        cy.clearCookie('foo')
      })

      it('.clearCookies()', { defaultCommandTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          assertLogLength(logs, 1)
          expect(logs[0].get('error')).to.eq(err)
          expect(logs[0].get('state')).to.eq('failed')
          expect(logs[0].get('name')).to.eq('clearCookies')
          expect(logs[0].get('message')).to.eq('')
          expect(err.message).to.include('Timed out retrying after 100ms: The command was expected to run against origin `http://localhost:3500` but the application is at origin `http://www.foobar.com:3500`.\n\nThis commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')

          done()
        })

        cy.clearCookies()
      })
    })

    context('#consoleProps', () => {
      const { _ } = Cypress
      let logs: Map<string, any>

      beforeEach(() => {
        logs = new Map()

        cy.on('log:changed', (attrs, log) => {
          logs.set(attrs.id, log)
        })
      })

      it('.getCookie()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.getCookies().should('be.empty')
          cy.setCookie('foo', 'bar')
          cy.getCookie('foo').its('value').should('equal', 'bar')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('getCookie', logs, 'foobar.com')

          expect(consoleProps.name).to.equal('getCookie')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props.Yielded).to.have.property('domain').that.includes('foobar.com')

          // BiDi currently does NOT provide the expiry time with their storage API
          if (Cypress.browser.name !== 'firefox') {
            expect(consoleProps.props.Yielded).to.have.property('expiry').that.is.a('number')
          }

          expect(consoleProps.props.Yielded).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.props.Yielded).to.have.property('secure').that.equals(false)
          expect(consoleProps.props.Yielded).to.have.property('name').that.equals('foo')
          expect(consoleProps.props.Yielded).to.have.property('value').that.equals('bar')
          expect(consoleProps.props.Yielded).to.have.property('path').that.is.a('string')
        })
      })

      it('.getCookies()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.getCookies().should('be.empty')

          cy.setCookie('foo', 'bar')
          cy.getCookies()
        })

        cy.shouldWithTimeout(() => {
        // get the last 'getCookies' command, which is the one we care about for this test
          const allGetCookieLogs = findCrossOriginLogs('getCookies', logs, 'foobar.com')

          const { consoleProps } = allGetCookieLogs.pop() as any

          expect(consoleProps.name).to.equal('getCookies')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props['Num Cookies']).to.equal(1)

          // can't exactly assert on length() as this is a array proxy object
          expect(consoleProps.props.Yielded.length).to.equal(1)

          // BiDi currently does NOT provide the expiry time with their storage API
          if (Cypress.browser.name !== 'firefox') {
            expect(consoleProps.props.Yielded[0]).to.have.property('expiry').that.is.a('number')
          }

          expect(consoleProps.props.Yielded[0]).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.props.Yielded[0]).to.have.property('secure').that.equals(false)
          expect(consoleProps.props.Yielded[0]).to.have.property('name').that.equals('foo')
          expect(consoleProps.props.Yielded[0]).to.have.property('value').that.equals('bar')
          expect(consoleProps.props.Yielded[0]).to.have.property('path').that.is.a('string')
        })
      })

      it('.setCookie()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.getCookies().should('be.empty')

          cy.setCookie('foo', 'bar')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('setCookie', logs, 'foobar.com')

          expect(consoleProps.name).to.equal('setCookie')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props.Yielded).to.have.property('domain').that.includes('foobar.com')

          // BiDi currently does NOT provide the expiry time with their storage API
          if (Cypress.browser.name !== 'firefox') {
            expect(consoleProps.props.Yielded).to.have.property('expiry').that.is.a('number')
          }

          expect(consoleProps.props.Yielded).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.props.Yielded).to.have.property('secure').that.equals(false)
          expect(consoleProps.props.Yielded).to.have.property('name').that.equals('foo')
          expect(consoleProps.props.Yielded).to.have.property('value').that.equals('bar')
          expect(consoleProps.props.Yielded).to.have.property('path').that.is.a('string')
        })
      })

      it('.clearCookie()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.setCookie('foo', 'bar')
          cy.getCookie('foo').should('not.be.null')
          cy.clearCookie('foo')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('clearCookie', logs, 'foobar.com')

          expect(consoleProps.name).to.equal('clearCookie')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props.Yielded).to.equal('null')
          expect(consoleProps.props['Cleared Cookie']).to.have.property('domain').that.includes('foobar.com')

          // BiDi currently does NOT provide the expiry time with their storage API
          if (Cypress.browser.name !== 'firefox') {
            expect(consoleProps.props['Cleared Cookie']).to.have.property('expiry').that.is.a('number')
          }

          expect(consoleProps.props['Cleared Cookie']).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.props['Cleared Cookie']).to.have.property('secure').that.equals(false)
          expect(consoleProps.props['Cleared Cookie']).to.have.property('name').that.equals('foo')
          expect(consoleProps.props['Cleared Cookie']).to.have.property('value').that.equals('bar')
          expect(consoleProps.props['Cleared Cookie']).to.have.property('path').that.is.a('string')
        })
      })

      it('.clearCookies()', () => {
        cy.origin('http://www.foobar.com:3500', () => {
          cy.setCookie('foo', 'bar')
          cy.setCookie('faz', 'baz')

          cy.getCookies().should('have.length', 2)
          cy.clearCookies()
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('clearCookies', logs, 'foobar.com')

          expect(consoleProps.name).to.equal('clearCookies')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props['Num Cookies']).to.equal(2)

          expect(consoleProps.props.Yielded).to.equal('null')

          expect(consoleProps.props['Cleared Cookies'].length).to.equal(2)

          expect(consoleProps.props['Cleared Cookies'][0]).to.have.property('name').that.equals('foo')
          expect(consoleProps.props['Cleared Cookies'][0]).to.have.property('value').that.equals('bar')

          expect(consoleProps.props['Cleared Cookies'][1]).to.have.property('name').that.equals('faz')
          expect(consoleProps.props['Cleared Cookies'][1]).to.have.property('value').that.equals('baz')

          _.forEach(consoleProps.props['Cleared Cookies'], (clearedCookie) => {
            expect(clearedCookie).to.have.property('httpOnly').that.equals(false)
            expect(clearedCookie).to.have.property('secure').that.equals(false)
            expect(clearedCookie).to.have.property('path').that.is.a('string')
          })
        })
      })
    })
  })

  context('server side', () => {
    it('supports Set-Cookie response header through fetch request', () => {
      cy.intercept('/dump-headers').as('headers')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('/')
        cy.window().then((win) => {
          return cy.wrap(win.fetch('/set-cookie?cookie=foo=bar;'))
        })

        cy.window().then((win) => {
          win.location.href = 'http://www.foobar.com:3500/dump-headers'
        })

        cy.wait('@headers')

        cy.contains('"cookie":"foo=bar"')
        cy.wait(0) // Give the server a chance to catch up
        cy.getCookie('foo').its('value').should('equal', 'bar')
      })
    })
  })
})
