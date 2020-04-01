/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _,
} = Cypress
const {
  $,
} = Cypress

describe('src/cy/commands/location', function () {
  beforeEach(() => cy.visit('/fixtures/generic.html'))

  context('#url', function () {
    it('returns the location href', () => cy.url().then((url) => expect(url).to.eq('http://localhost:3500/fixtures/generic.html')))

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.href = '/foo/bar/baz.html'
      }
      , 100)

      return cy.url().should('match', /baz/).and('eq', 'http://localhost:3500/foo/bar/baz.html')
    })

    it('catches thrown errors', () => {
      cy.stub(Cypress.utils, 'locToString')
      .onFirstCall().throws(new Error)
      .onSecondCall().returns('http://localhost:3500/baz.html')

      return cy.url().should('include', '/baz.html')
    })

    describe('assertion verification', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      return it('eventually passes the assertion', function () {
        cy.on('command:retry', _.after(2, _.once(() => {
          const win = cy.state('window')

          win.location.href = '/foo/bar/baz.html'
        })))

        return cy.url().should('match', /baz/).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          return done()
        })

        return cy.url().should('eq', 'not-this')
      })

      return it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.url().should('eq', 'not-this')
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('ends immediately', () => {
        return cy.url().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('ended')).to.be.true

          return expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        return cy.url().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        return cy.url().then(function () {
          const obj = {
            name: 'url',
            message: '',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('does not emit when {log: false}', () => {
        return cy.url({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      return it('#consoleProps', () => {
        return cy.url().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          return expect(consoleProps).to.deep.eq({
            Command: 'url',
            Yielded: 'http://localhost:3500/fixtures/generic.html',
          })
        })
      })
    })
  })

  context('#hash', function () {
    it('returns the location hash', () => cy.hash().then((hash) => expect(hash).to.eq('')))

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.hash = 'users/1'
      }
      , 100)

      return cy.hash().should('match', /users/).and('eq', '#users/1')
    })

    describe('assertion verification', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      return it('eventually passes the assertion', function () {
        cy.on('command:retry', _.after(2, () => {
          const win = cy.state('window')

          win.location.hash = 'users/1'
        }))

        return cy.hash().should('match', /users/).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          return done()
        })

        return cy.hash().should('eq', 'not-this')
      })

      return it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.hash().should('eq', 'not-this')
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('ends immediately', () => {
        return cy.hash().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('ended')).to.be.true

          return expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        return cy.hash().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        return cy.hash().then(function () {
          const obj = {
            name: 'hash',
            message: '',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('does not emit when {log: false}', () => {
        return cy.hash({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      return it('#consoleProps', () => {
        return cy.hash().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          return expect(consoleProps).to.deep.eq({
            Command: 'hash',
            Yielded: '',
          })
        })
      })
    })
  })

  return context('#location', function () {
    it('returns the location object', () => cy.location().then((loc) => expect(loc).to.have.keys(['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'origin', 'pathname', 'port', 'protocol', 'search', 'originPolicy', 'superDomain', 'toString'])))

    it('returns a specific key from location object', () => cy.location('href').then((href) => expect(href).to.eq('http://localhost:3500/fixtures/generic.html')))

    it('eventually resolves', () => {
      _.delay(() => {
        const win = cy.state('window')

        win.location.pathname = 'users/1'
      }
      , 100)

      return cy.location().should('have.property', 'pathname').and('match', /users/)
    })

    describe('assertion verification', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      return it('eventually passes the assertion', function () {
        cy.on('command:retry', _.after(2, _.once(() => {
          const win = cy.state('window')

          win.location.pathname = 'users/1'
        })))

        return cy.location('pathname').should('match', /users/).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws when passed a non-existent key', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).to.include('Location object does not have key: `ladida`')
          expect(err.docsUrl).to.include('https://on.cypress.io/location')
          expect(lastLog.get('name')).to.eq('location')
          expect(lastLog.get('state')).to.eq('failed')

          return done()
        })

        return cy.location('ladida')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          return done()
        })

        return cy.location('pathname').should('eq', 'not-this')
      })

      return it('does not log an additional log on failure', function (done) {
        const logs = []

        cy.on('log:added', (attrs, log) => logs.push(log))

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.location('pathname').should('eq', 'not-this')
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('ends immediately', () => {
        return cy.location('href').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('ended')).to.be.true

          return expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        return cy.location('href').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('does not emit when {log: false} as options', () => {
        return cy.location('href', { log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      it('does not emit when {log: false} as key', () => {
        return cy.location({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      it('logs obj without a message', () => {
        return cy.location().then(function () {
          const obj = {
            name: 'location',
            message: '',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('logs obj with a message', () => {
        return cy.location('origin').then(function () {
          const obj = {
            name: 'location',
            message: 'origin',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            return expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      return it('#consoleProps', () => {
        return cy.location().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(_.keys(consoleProps)).to.deep.eq(['Command', 'Yielded'])
          expect(consoleProps.Command).to.eq('location')

          return expect(_.keys(consoleProps.Yielded)).to.deep.eq(['auth', 'authObj', 'hash', 'href', 'host', 'hostname', 'origin', 'pathname', 'port', 'protocol', 'search', 'originPolicy', 'superDomain', 'toString'])
        })
      })
    })
  })
})
