/* eslint-disable
    brace-style,
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
  Promise,
} = Cypress

describe('src/cy/commands/fixtures', function () {
  beforeEach(() => Cypress.emit('clear:fixtures:cache'))

  // call all of the fixture triggers async to simulate
  // the real browser environment
  return context('#fixture', function () {
    beforeEach(() => // call through normally on everything
    {
      return cy.stub(Cypress, 'backend').callThrough()
    })

    it('triggers \'fixture\' on Cypress', () => {
      Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

      return cy.fixture('foo').as('f').then((obj) => {
        expect(obj).to.deep.eq({ foo: 'bar' })

        return expect(Cypress.backend).to.be.calledWith('get:fixture', 'foo', {})
      })
    })

    it('can support an array of fixtures')

    it('can have encoding as second argument', () => {
      Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

      return cy.fixture('foo', 'ascii').then((obj) => {
        expect(obj).to.deep.eq({ foo: 'bar' })

        return expect(Cypress.backend).to.be.calledWith('get:fixture', 'foo', {
          encoding: 'ascii',
        })
      })
    })

    it('can have encoding as second argument and options as third argument', () => {
      Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

      return cy.fixture('foo', 'ascii', { timeout: 1000 }).then((obj) => {
        expect(obj).to.deep.eq({ foo: 'bar' })

        return expect(Cypress.backend).to.be.calledWith('get:fixture', 'foo', {
          encoding: 'ascii',
        })
      })
    })

    it('really works', () => cy.fixture('example').should('deep.eq', { example: true }))

    it('can read a fixture without extension with multiple dots in the name', () => cy.fixture('foo.bar.baz').should('deep.eq', { quux: 'quuz' }))

    it('looks for csv without extension', () => {
      return cy.fixture('comma-separated').should('equal', `\
One,Two,Three
1,2,3
\
`)
    })

    it('handles files with unknown extensions, reading them as utf-8', () => {
      return cy.fixture('yaml.yaml').should('equal', `\
- foo
- bar
- 
\
`)
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'fixture') {
            this.lastLog = log

            return this.logs.push(log)
          }
        })

        return null
      })

      it('throws if fixturesFolder is set to false', function (done) {
        Cypress.config('fixturesFolder', false)

        cy.on('fail', () => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error').message).to.eq('`cy.fixture()` is not valid because you have configured `fixturesFolder` to `false`.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/fixture')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('fixture')

          return done()
        })

        return cy.fixture('foo')
      })

      it('throws when fixture cannot be found without extension', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('fixture')
          expect(lastLog.get('message')).to.eq('err')

          expect(err.message).to.include('A fixture file could not be found')
          expect(err.message).to.include('cypress/fixtures/err')

          return done()
        })

        return cy.fixture('err')
      })

      it('throws when fixture cannot be found with extension', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('fixture')
          expect(lastLog.get('message')).to.eq('err.txt')

          expect(err.message).to.include('A fixture file could not be found')
          expect(err.message).to.include('cypress/fixtures/err.txt')

          return done()
        })

        return cy.fixture('err.txt')
      })

      return it('throws after timing out', function (done) {
        Cypress.backend.withArgs('get:fixture').resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('fixture')
          expect(lastLog.get('message')).to.eq('foo, {timeout: 50}')
          expect(err.message).to.eq('`cy.fixture()` timed out waiting `50ms` to receive a fixture. No fixture was ever sent by the server.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/fixture')

          return done()
        })

        return cy.fixture('foo', { timeout: 50 })
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', () => {
        Cypress.config('responseTimeout', 2500)

        Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.fixture('foo').then(() => expect(timeout).to.be.calledWith(2500))
      })

      it('can override timeout', () => {
        Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

        const timeout = cy.spy(Promise.prototype, 'timeout')

        return cy.fixture('foobar', { timeout: 1000 }).then(() => expect(timeout).to.be.calledWith(1000))
      })

      return it('clears the current timeout and restores after success', () => {
        Cypress.backend.withArgs('get:fixture').resolves({ foo: 'bar' })

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        return cy.fixture('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:fixture')

          // restores the timeout afterwards
          return expect(cy.timeout()).to.eq(100)
        })
      })
    })

    return describe('caching', () => {
      beforeEach(() => {
        return Cypress.backend
        .withArgs('get:fixture', 'foo')
        .resolves({ foo: 'bar' })
        .withArgs('get:fixture', 'bar')
        .resolves({ bar: 'baz' })
      })

      it('caches fixtures by name', () => {
        return cy.fixture('foo').then((obj) => {
          expect(obj).to.deep.eq({ foo: 'bar' })

          return cy.fixture('bar').then((obj) => {
            expect(obj).to.deep.eq({ bar: 'baz' })

            return cy.fixture('foo').then((obj) => {
              return expect(obj).to.deep.eq({ foo: 'bar' })
            })
          })
        })

        .then(() => expect(Cypress.backend).to.be.calledTwice)
      })

      return it('clones fixtures to prevent accidental mutation', () => {
        return cy.fixture('foo').then((obj) => {
        // mutate the object
          obj.baz = 'quux'

          return cy.fixture('foo').then((obj2) => {
            obj2.lorem = 'ipsum'
            expect(obj2).not.to.have.property('baz')

            return cy.fixture('foo').then((obj3) => expect(obj3).not.to.have.property('lorem'))
          }).then(() => expect(Cypress.backend).to.be.calledOnce)
        })
      })
    })
  })
})
