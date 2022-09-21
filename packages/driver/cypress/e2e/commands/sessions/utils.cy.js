const {
  getConsoleProps,
  navigateAboutBlank,
} = require('@packages/driver/src/cy/commands/sessions/utils')

describe('src/cy/commands/sessions/utils.ts', () => {
  describe('.getConsoleProps', () => {
    it('for one domain with neither cookies or localStorage set', () => {
      const sessionState = {
        id: 'session1',
      }

      const consoleProps = getConsoleProps(sessionState)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.table).to.have.length(0)
    })

    it('for one domain with only cookies set', () => {
      const sessionState = {
        id: 'session1',
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
        ],
      }

      const consoleProps = getConsoleProps(sessionState)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.table).to.have.length(1)
      const cookiesTable = consoleProps.table[0]()

      expect(cookiesTable.name).to.contain('Cookies - localhost (1)')
      expect(cookiesTable.data).to.deep.eq(sessionState.cookies)
    })

    it('for one domain with only localStorage set', () => {
      const sessionState = {
        id: 'session1',
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
        ],
      }
      const consoleProps = getConsoleProps(sessionState)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.table).to.have.length(1)
      const localStorageTable = consoleProps.table[0]()

      expect(localStorageTable.name).to.contain('Storage - localhost (1)')
      expect(localStorageTable.data).to.have.length(1)
      expect(localStorageTable.data).to.deep.eq([{ key: 'stor-foo', value: 's-f' }])
    })

    it('for one domain with both cookies and localStorage set', () => {
      const sessionState = {
        id: 'session1',
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
        ],
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
        ],
      }

      const consoleProps = getConsoleProps(sessionState)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.table).to.have.length(2)
      let table = consoleProps.table[0]()

      expect(table.name).to.contain('Cookies - localhost (1)')
      expect(table.data).to.have.length(1)
      expect(table.data).to.deep.eq(sessionState.cookies)

      table = consoleProps.table[1]()
      expect(table.name).to.contain('Storage - localhost (1)')
      expect(table.data).to.have.length(1)
      expect(table.data).to.deep.eq([{ key: 'stor-foo', value: 's-f' }])
    })

    it('for multiple domains', () => {
      const sessionState = {
        id: 'session1',
        cookies: [
          { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expiry: 123 },
          { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expiry: 456 },
        ],
        localStorage: [
          { origin: 'localhost', value: { 'stor-foo': 's-f' } },
          { origin: 'http://example.com', value: { 'random': 'hi' } },
        ],
      }

      const consoleProps = getConsoleProps(sessionState)

      expect(consoleProps.id).to.eq('session1')
      expect(consoleProps.table).to.have.length(3)
      let table = consoleProps.table[0]()

      expect(table.name).to.contain('Cookies - localhost (2)')
      expect(table.data).to.have.length(2)
      expect(table.data).to.deep.eq(sessionState.cookies)

      table = consoleProps.table[1]()
      expect(table.name).to.contain('Storage - localhost (1)')
      expect(table.data).to.have.length(1)
      expect(table.data).to.deep.eq([{ key: 'stor-foo', value: 's-f' }])

      table = consoleProps.table[2]()
      expect(table.name).to.contain('Storage - example.com (1)')
      expect(table.data).to.have.length(1)
      expect(table.data).to.deep.eq([{ key: 'random', value: 'hi' }])
    })
  })

  describe('.navigateAboutBlank', () => {
    it('triggers session blank page visit', () => {
      const stub = cy.stub(Cypress, 'action').log(false)
      .callThrough()
      .withArgs('cy:visit:blank')

      cy.then(() => {
        navigateAboutBlank()
        navigateAboutBlank(true)
        expect(stub).to.have.been.calledTwice
        expect(stub.args[0]).to.deep.eq(['cy:visit:blank', { type: 'session' }])
        expect(stub.args[1]).to.deep.eq(['cy:visit:blank', { type: 'session' }])
      })
    })

    it('triggers session-lifecycle blank page visit', () => {
      const stub = cy.stub(Cypress, 'action').log(false)
      .callThrough()
      .withArgs('cy:visit:blank')

      cy.then(() => {
        navigateAboutBlank(false)
        expect(stub).to.have.been.calledWith('cy:visit:blank', { type: 'session-lifecycle' })
      })
    })
  })
})
