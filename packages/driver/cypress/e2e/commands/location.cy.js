const { assertLogLength } = require('../../support/utils')
const { _ } = Cypress

describe('src/cy/commands/location', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  context('#url', () => {
    it('returns the location href', () => {
      cy.url().then((url) => {
        expect(url).to.eq('http://localhost:3500/fixtures/generic.html')
      })
    })

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.href = '/foo/bar/baz.html'
      }, 100)

      cy.url().should('match', /baz/).and('eq', 'http://localhost:3500/foo/bar/baz.html')
    })

    it('catches thrown errors', () => {
      cy.stub(Cypress.utils, 'locToString')
      .onFirstCall().throws(new Error)
      .onSecondCall().returns('http://localhost:3500/baz.html')

      cy.url().should('include', '/baz.html')
    })

    // https://github.com/cypress-io/cypress/issues/17399
    it('url decode option', () => {
      // encodeURI() is used below because we cannot visit the site without it.
      // For the curious, 사랑 means "love" in Korean.
      cy.visit(encodeURI('/custom-headers?x=사랑'))

      cy.url({ decode: true }).should('contain', '사랑')
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, _.once(() => {
          const win = cy.state('window')

          win.location.href = '/foo/bar/baz.html'
        })))

        cy.url().should('match', /baz/).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.url().should('eq', 'not-this')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 2)

          done()
        })

        cy.url().should('eq', 'not-this')
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

      it('ends immediately', () => {
        cy.url().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.url().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        cy.url().then(function () {
          const obj = {
            name: 'url',
            message: '',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.url({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.url({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('url')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('#consoleProps', () => {
        cy.url().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps).to.deep.eq({
            name: 'url',
            type: 'command',
            props: {
              Yielded: 'http://localhost:3500/fixtures/generic.html',
            },
          })
        })
      })
    })
  })

  context('#hash', () => {
    it('returns the location hash', () => {
      cy.hash().then((hash) => {
        expect(hash).to.eq('')
      })
    })

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.hash = 'users/1'
      }, 100)

      cy.hash().should('match', /users/).and('eq', '#users/1')
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          const win = cy.state('window')

          win.location.hash = 'users/1'
        }))

        cy.hash().should('match', /users/).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.hash().should('eq', 'not-this')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 2)

          done()
        })

        cy.hash().should('eq', 'not-this')
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

      it('ends immediately', () => {
        cy.hash().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.hash().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        cy.hash().then(function () {
          const obj = {
            name: 'hash',
            message: '',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.hash({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.hash({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('hash')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('#consoleProps', () => {
        cy.hash().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps).to.deep.eq({
            name: 'hash',
            type: 'command',
            props: {
              Yielded: '',
            },
          })
        })
      })
    })
  })

  context('#location', () => {
    it('returns the location object', () => {
      cy.location().then((loc) => {
        expect(loc).to.have.keys(['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'pathname', 'port', 'protocol', 'search', 'origin', 'superDomainOrigin', 'superDomain', 'toString'])
      })
    })

    it('returns a specific key from location object', () => {
      cy.location('href').then((href) => {
        expect(href).to.eq('http://localhost:3500/fixtures/generic.html')
      })
    })

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.pathname = 'users/1'
      }, 100)

      cy.location().should('have.property', 'pathname').and('match', /users/)
    })

    // https://github.com/cypress-io/cypress/issues/16463
    it('eventually returns a given key', function () {
      cy.stub(cy, 'getRemoteLocation')
      .onFirstCall().returns('')
      .onSecondCall().returns({
        pathname: '/my/path',
      })

      cy.location('pathname').should('equal', '/my/path')
      .then(() => {
        expect(cy.getRemoteLocation).to.have.been.calledTwice
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, _.once(() => {
          const win = cy.state('window')

          win.location.pathname = 'users/1'
        })))

        cy.location('pathname').should('match', /users/).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('throws when passed a non-existent key', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).to.include('Location object does not have key: `ladida`')
          expect(err.docsUrl).to.include('https://on.cypress.io/location')
          expect(lastLog.get('name')).to.eq('location')
          expect(lastLog.get('state')).to.eq('failed')

          done()
        })

        cy.location('ladida')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.location('pathname').should('eq', 'not-this')
      })

      it('does not log an additional log on failure', function (done) {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          logs.push(log)
        })

        cy.on('fail', () => {
          assertLogLength(this.logs, 2)

          done()
        })

        cy.location('pathname').should('eq', 'not-this')
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

      it('ends immediately', () => {
        cy.location('href').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.location('href').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can turn off logging with {log: false} as options', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.location('href', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can turn off logging with {log: false} as key', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.location({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.location('href', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name'), 'log name').to.eq('location')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('logs obj without a message', () => {
        cy.location().then(function () {
          const obj = {
            name: 'location',
            message: '',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('logs obj with a message', () => {
        cy.location('origin').then(function () {
          const obj = {
            name: 'location',
            message: 'origin',
          }

          const { lastLog } = this

          expect(_.pick(lastLog.attributes, ['name', 'message'])).to.eql(obj)
        })
      })

      it('#consoleProps', () => {
        cy.location().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(_.keys(consoleProps)).to.deep.eq(['name', 'type', 'props'])
          expect(consoleProps.name).to.eq('location')
          expect(consoleProps.type).to.eq('command')
          expect(_.keys(consoleProps.props.Yielded)).to.deep.eq(['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'origin', 'pathname', 'port', 'protocol', 'search', 'superDomainOrigin', 'superDomain', 'toString'])
        })
      })
    })
  })
})
