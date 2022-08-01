import { findCrossOriginLogs } from '../../../../support/utils'

describe('cy.origin cookies', () => {
  context('client side', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('.getCookie(), .getCookies(), and .setCookie()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.getCookies().should('be.empty')

        cy.setCookie('foo', 'bar')

        cy.getCookie('foo').should('have.property', 'value', 'bar')
        cy.getCookies().should('have.length', 1)
      })
    })

    it('.clearCookie()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.setCookie('foo', 'bar')
        cy.getCookie('foo').should('not.be.null')
        cy.clearCookie('foo')
        cy.getCookie('foo').should('be.null')
      })
    })

    it('.clearCookies()', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.setCookie('foo', 'bar')
        cy.setCookie('faz', 'baz')

        cy.getCookies().should('have.length', 2)
        cy.clearCookies()
        cy.getCookies().should('be.empty')
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
        cy.origin('http://foobar.com:3500', () => {
          cy.getCookies().should('be.empty')
          cy.setCookie('foo', 'bar')
          cy.getCookie('foo')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('getCookie', logs, 'foobar.com')

          expect(consoleProps.Command).to.equal('getCookie')
          expect(consoleProps.Yielded).to.have.property('domain').that.includes('foobar.com')
          expect(consoleProps.Yielded).to.have.property('expiry').that.is.a('number')
          expect(consoleProps.Yielded).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.Yielded).to.have.property('secure').that.equals(false)
          expect(consoleProps.Yielded).to.have.property('name').that.equals('foo')
          expect(consoleProps.Yielded).to.have.property('value').that.equals('bar')
          expect(consoleProps.Yielded).to.have.property('path').that.is.a('string')
        })
      })

      it('.getCookies()', () => {
        cy.origin('http://foobar.com:3500', () => {
          cy.getCookies().should('be.empty')

          cy.setCookie('foo', 'bar')
          cy.getCookies()
        })

        cy.shouldWithTimeout(() => {
        // get the last 'getCookies' command, which is the one we care about for this test
          const allGetCookieLogs = findCrossOriginLogs('getCookies', logs, 'foobar.com')

          const { consoleProps } = allGetCookieLogs.pop() as any

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
        })
      })

      it('.setCookie()', () => {
        cy.origin('http://foobar.com:3500', () => {
          cy.getCookies().should('be.empty')

          cy.setCookie('foo', 'bar')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('setCookie', logs, 'foobar.com')

          expect(consoleProps.Command).to.equal('setCookie')
          expect(consoleProps.Yielded).to.have.property('domain').that.includes('foobar.com')
          expect(consoleProps.Yielded).to.have.property('expiry').that.is.a('number')
          expect(consoleProps.Yielded).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps.Yielded).to.have.property('secure').that.equals(false)
          expect(consoleProps.Yielded).to.have.property('name').that.equals('foo')
          expect(consoleProps.Yielded).to.have.property('value').that.equals('bar')
          expect(consoleProps.Yielded).to.have.property('path').that.is.a('string')
        })
      })

      it('.clearCookie()', () => {
        cy.origin('http://foobar.com:3500', () => {
          cy.setCookie('foo', 'bar')
          cy.getCookie('foo').should('not.be.null')
          cy.clearCookie('foo')
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('clearCookie', logs, 'foobar.com')

          expect(consoleProps.Command).to.equal('clearCookie')
          expect(consoleProps.Yielded).to.equal('null')
          expect(consoleProps['Cleared Cookie']).to.have.property('domain').that.includes('foobar.com')
          expect(consoleProps['Cleared Cookie']).to.have.property('expiry').that.is.a('number')
          expect(consoleProps['Cleared Cookie']).to.have.property('httpOnly').that.equals(false)
          expect(consoleProps['Cleared Cookie']).to.have.property('secure').that.equals(false)
          expect(consoleProps['Cleared Cookie']).to.have.property('name').that.equals('foo')
          expect(consoleProps['Cleared Cookie']).to.have.property('value').that.equals('bar')
          expect(consoleProps['Cleared Cookie']).to.have.property('path').that.is.a('string')
        })
      })

      it('.clearCookies()', () => {
        cy.origin('http://foobar.com:3500', () => {
          cy.setCookie('foo', 'bar')
          cy.setCookie('faz', 'baz')

          cy.getCookies().should('have.length', 2)
          cy.clearCookies()
        })

        cy.shouldWithTimeout(() => {
          const { consoleProps } = findCrossOriginLogs('clearCookies', logs, 'foobar.com')

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
        cy.getCookie('foo').its('value').should('equal', 'bar')
      })
    })
  })
})
