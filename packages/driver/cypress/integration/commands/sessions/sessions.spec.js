// const baseUrl = Cypress.config('baseUrl')
// const iframeBaseUrl = Cypress.env('iframeBaseUrl')

// const expectCurrentSessionData = (obj) => {
//   cy.then(async () => {
//     return await Cypress.session.getCurrentSessionData()
//     .then((result) => {
//       expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
//       expect(result.localStorage).deep.members(obj.localStorage || [])
//       expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
//     })
//   })
// }

beforeEach(() => {
  if (top.doNotClearSessions) {
    top.doNotClearSessions = false

    return
  }

  cy.wrap(Cypress.session.clearAllSavedSessions(), { log: false })
})

// const sessionUser = (name = 'user0') => {
//   return cy.session(name, () => {
//     cy.visit(`/cross_origin_iframe/${name}`)
//     cy.window().then((win) => {
//       win.localStorage.username = name
//     })
//   })
// }

describe('cy.session', () => {
  describe('args', () => {
    it('accepts string as id', () => {
      cy.session('some-name', () => {})
      cy.session({ name: 'some-name', zkey: 'val' }, () => {})
    })

    it('accepts array as id', () => {
      cy.session('some-name', () => {})
    })

    it('accepts object as id', () => {
      cy.session('some-name', () => {})
    })

    it('uses sorted stringify and rejects duplicate registrations', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).contain('previously used name')
        expect(err.message).contain('{"key":"val"')
        done()
      })

      cy.session({ name: 'bob', key: 'val' }, () => {
        // foo
      })

      cy.session({ key: 'val', name: 'bob' }, () => {
        // bar
      })
    })
  })

  describe('.log', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.lastLog = log
        this.logs.push(log)
      })

      return null
    })
  })

  describe('errors', () => {
    let lastLog = null
    let logs = []

    beforeEach(() => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'session') {
          lastLog = log
          logs.push(log)
        }
      })

      return null
    })

    it('throws when sessionId argument was not provided', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session()
    })

    it('throws when sessionId argument is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session(1)
    })

    it('throws when options argument is provided and is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The optional third argument `options` must be an object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, 'invalid_arg')
    })

    it('throws when options argument has an invalid option', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option: **invalid_key**\nAvailable options are: `validate`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { invalid_key: 2 })
    })

    it('throws when options argument has an option with an invalid type', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option value. **validate** must be of type **function** but was **number**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { validate: 2 })
    })

    it('throws when setup function is not provided and existing session is not found', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('No session is defined with the name\n  **some-session**\nIn order to use `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup)`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session')
    })

    it('throws when sessionId is duplicated with different setup functions', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('You may not call `cy.session()` with a previously used name and different options. If you want to specify different options, please use a unique name other than **some-session**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => true)
      cy.session('some-session', () => false)
    })
  })
})
