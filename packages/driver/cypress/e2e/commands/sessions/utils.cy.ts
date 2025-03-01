import {
  getConsoleProps,
  navigateAboutBlank,
} from '../../../../src/cy/commands/sessions/utils'

describe('src/cy/commands/sessions/utils.ts', () => {
  const logForDebugging = (consoleProps) => {
    Cypress.log({
      name: 'debug',
      message: 'click this log to view how this renders in the console',
      event: true,
      consoleProps,
    })
  }

  describe('.getConsoleProps', () => {
    it('for one domain with neither cookies or localStorage set', () => {
      const sessionState = {
        id: 'session1',
        hydrated: false,
        cacheAcrossSpecs: false,
        setup: () => {},
      }

      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)
      expect(consoleProps.Warning).to.eq('⚠️ There are no cookies, local storage nor session storage associated with this session')
      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.groups).to.have.length(0)
    })

    it('for one domain with only cookies set', () => {
      const sessionState = {
        id: 'session1',
        hydrated: true,
        cacheAcrossSpecs: false,
        setup: () => {},
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
        ],
      }

      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.Domains).to.eq('This session captured data from localhost.')

      expect(consoleProps.groups).to.have.length(1)
      expect(consoleProps.groups[0].name).to.eq('localhost data:')
      expect(consoleProps.groups[0].groups).to.have.length(1)

      const cookieData = consoleProps.groups[0].groups[0]

      expect(cookieData.name).to.contain('Cookies - (1)')
      expect(cookieData.items).to.deep.eq(sessionState.cookies)
    })

    it('for one domain with only localStorage set', () => {
      const sessionState = {
        id: 'session1',
        hydrated: true,
        cacheAcrossSpecs: false,
        setup: () => {},
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
        ],
      }
      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.Domains).to.eq('This session captured data from localhost.')

      expect(consoleProps.groups).to.have.length(1)
      expect(consoleProps.groups[0].name).to.eq('localhost data:')
      expect(consoleProps.groups[0].groups).to.have.length(1)

      const localStorageData = consoleProps.groups[0].groups[0]

      expect(localStorageData.name).to.contain('Local Storage - (1)')
      expect(localStorageData.items).to.deep.eq({ 'stor-foo': 's-f' })
    })

    it('for one domain with only sessionStorage set', () => {
      const sessionState = {
        id: 'session1',
        hydrated: true,
        cacheAcrossSpecs: false,
        setup: () => {},
        sessionStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
        ],
      }
      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.Domains).to.eq('This session captured data from localhost.')

      expect(consoleProps.groups).to.have.length(1)
      expect(consoleProps.groups[0].name).to.eq('localhost data:')
      expect(consoleProps.groups[0].groups).to.have.length(1)

      const sessionStorageData = consoleProps.groups[0].groups[0]

      expect(sessionStorageData.name).to.contain('Session Storage - (1)')
      expect(sessionStorageData.items).to.deep.eq({ 'stor-foo': 's-f' })
    })

    it('for one domain with both cookies and localStorage set', () => {
      const sessionState = {
        id: 'session1',
        hydrated: true,
        cacheAcrossSpecs: false,
        setup: () => {},
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
        ],
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
        ],
      }

      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.Domains).to.eq('This session captured data from localhost.')

      expect(consoleProps.groups).to.have.length(1)
      expect(consoleProps.groups[0].name).to.eq('localhost data:')
      expect(consoleProps.groups[0].groups).to.have.length(2)

      const cookieData = consoleProps.groups[0].groups[0]
      const localStorageData = consoleProps.groups[0].groups[1]

      expect(cookieData.name).to.contain('Cookies - (1)')
      expect(cookieData.items).to.deep.eq(sessionState.cookies)

      expect(localStorageData.name).to.contain('Local Storage - (1)')
      expect(localStorageData.items).to.deep.eq({ 'stor-foo': 's-f' })
    })

    it('for multiple domains', () => {
      const sessionState = {
        id: 'session1',
        hydrated: true,
        cacheAcrossSpecs: false,
        setup: () => {},
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
          { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expiry: 456 },
        ],
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
          { origin: 'http://example.com', value: { 'random': 'hi' } },
        ],
      }

      // @ts-expect-error TODO: sessionState needs more accurate types or this test data needs updating.
      const consoleProps = getConsoleProps(sessionState)

      logForDebugging(consoleProps)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.Domains).to.eq('This session captured data from localhost and example.com.')

      expect(consoleProps.groups).to.have.length(2)
      expect(consoleProps.groups[0].name).to.eq('localhost data:')
      expect(consoleProps.groups[0].groups).to.have.length(2)

      const cookieData = consoleProps.groups[0].groups[0]
      let localStorageData = consoleProps.groups[0].groups[1]

      expect(cookieData.name).to.contain('Cookies - (2)')
      expect(cookieData.items).to.deep.eq(sessionState.cookies)

      expect(localStorageData.name).to.contain('Local Storage - (1)')
      expect(localStorageData.items).to.deep.eq({ 'stor-foo': 's-f' })

      expect(consoleProps.groups[1].name).to.eq('example.com data:')
      expect(consoleProps.groups[1].groups).to.have.length(1)

      localStorageData = consoleProps.groups[1].groups[0]

      expect(localStorageData.name).to.contain('Local Storage - (1)')
      expect(localStorageData.items).to.deep.eq({ 'random': 'hi' })
    })
  })

  describe('.navigateAboutBlank', () => {
    it('triggers test isolation blank page visit', () => {
      const spy = cy.spy(Cypress, 'action').log(false)
      .withArgs('cy:visit:blank')

      cy.then(async () => {
        await navigateAboutBlank()
        await navigateAboutBlank({ inBetweenTestsAndNextTestHasTestIsolationOn: true })
        expect(spy).to.have.been.calledTwice
        expect(spy.args[0]).to.deep.eq(['cy:visit:blank', { testIsolation: true }])
        expect(spy.args[1]).to.deep.eq(['cy:visit:blank', { testIsolation: true }])
      })
    })
  })
})
