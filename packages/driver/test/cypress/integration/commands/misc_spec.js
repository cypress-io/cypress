/* eslint-disable
    brace-style,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

const $dom = require('../../../../src/dom')

describe('src/cy/commands/misc', function () {
  before(() => {
    return cy
    .visit('/fixtures/jquery.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    return $(doc.body).empty().html(this.body)
  })

  context('#end', () => it('nulls out the subject', () => cy.noop({}).end().then((subject) => expect(subject).to.be.null)))

  context('#log', function () {
    it('nulls out the subject', () => cy.wrap({}).log('foo').then((subject) => expect(subject).to.be.null))

    return describe('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('logs immediately', function (done) {
        cy.on('log:added', (attrs, log) => {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('foo, {foo: bar}')
          expect(log.get('name')).to.eq('log')
          expect(log.get('end')).to.be.true

          return done()
        })

        return cy.log('foo', { foo: 'bar' }).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      return it('consoleProps', () => {
        return cy.log('foobarbaz', [{}]).then(function () {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'log',
            args: [{}],
            message: 'foobarbaz',
          })
        })
      })
    })
  })

  return context('#wrap', function () {
    beforeEach(function () {
      this.remoteWindow = cy.state('window')

      return delete this.remoteWindow.$.fn.foo
    })

    it('sets the subject to the first argument', () => cy.wrap({}).then((subject) => expect(subject).to.deep.eq({})))

    // https://github.com/cypress-io/cypress/issues/3241
    it('cy.wrap(undefined) should retry', () => {
      const stub = cy.stub()

      cy.wrap().should(() => {
        stub()

        return expect(stub).to.be.calledTwice
      })

      return cy.wrap(undefined).should(() => {
        stub()

        return expect(stub.callCount).to.eq(4)
      })
    })

    it('can wrap jquery objects and continue to chain', function () {
      this.remoteWindow.$.fn.foo = 'foo'

      const append = () => {
        return setTimeout(() => {
          return $('<li class=\'appended\'>appended</li>').appendTo(cy.$$('#list'))
        }
        , 50)
      }

      cy.on('command:retry', _.after(2, _.once(append)))

      return cy.get('#list').then(($ul) => {
        return cy
        // ensure that assertions are based on the real subject
        // and not the cy subject - therefore foo should be defined
        .wrap($ul).should('have.property', 'foo')

        // then re-wrap $ul and ensure that the subject passed
        // downstream is the cypress instance
        .wrap($ul)
        .find('li.appended')
        .then(($li) => // must use explicit non cy.should
        // else this test will always pass
        {
          return expect($li.length).to.eq(1)
        })
      })
    })

    // TODO: fix this test in 4.0 when we refactor validating subjects
    it.skip('throws a good error when wrapping mixed types: element + string', () => {
      return cy.get('button').then(($btn) => {
        const btn = $btn.get(0)

        return cy.wrap([btn, 'asdf']).click()
      })
    })

    it('can wrap an array of DOM elements and pass command validation', () => {
      return cy.get('button').then(($btn) => {
        const btn = $btn.get(0)

        cy.wrap([btn]).click().then(($btn) => expect($dom.isJquery($btn)).to.be.true)

        return cy.wrap([btn, btn]).click({ multiple: true }).then(($btns) => expect($dom.isJquery($btns)).to.be.true)
      })
    })

    it('can wrap an array of window without it being altered', () => {
      return cy.window().then((win) => {
        return cy.wrap([win]).then((arr) => {
          expect(arr).to.be.an('array')

          return expect(Array.isArray(arr)).to.be.true
        })
      })
    })

    it('can wrap an array of document without it being altered', () => {
      return cy.document().then((doc) => {
        return cy.wrap([doc]).then((arr) => {
          expect(arr).to.be.an('array')
          expect(Array.isArray(arr)).to.be.true

          return expect(arr[0]).to.eq(doc)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/2927
    it('can properly handle objects with \'jquery\' functions as properties', () => // the root issue here has to do with the fact that window.jquery points
    // to the jquery constructor, but not an actual jquery instance and
    // we need to account for that...
    {
      return cy.window().then((win) => {
        win.jquery = function () {}

        return win
      })
    })

    describe('errors', () => {
      it('throws when wrapping an array of windows', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.scrollTo()` failed because it requires a DOM element.')
          expect(err.message).to.include('[<window>]')
          expect(err.message).to.include('All 2 subject validations failed on this subject.')

          return done()
        })

        return cy.window().then((win) => cy.wrap([win]).scrollTo('bottom'))
      })

      return it('throws when wrapping an array of documents', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.screenshot()` failed because it requires a DOM element.')
          expect(err.message).to.include('[<document>]')
          expect(err.message).to.include('All 3 subject validations failed on this subject.')

          return done()
        })

        return cy.document().then((doc) => cy.wrap([doc]).screenshot())
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

      it('logs immediately', function (done) {
        cy.on('log:added', (attrs, log) => {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('{}')
          expect(log.get('name')).to.eq('wrap')
          expect(log.get('end')).not.to.be.ok

          return done()
        })

        return cy.wrap({}).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      return it('stringifies DOM elements and sets $el', function () {
        const body = $('body')

        return cy.wrap(body).then(function ($el) {
          const {
            lastLog,
          } = this

          // internally we store the real remote jquery
          // instance instead of the cypress one
          expect(lastLog.get('$el')).not.to.eq($el)

          // but make sure they are the same DOM object
          expect(lastLog.get('$el').get(0)).to.eq($el.get(0))

          return expect(lastLog.get('message')).to.eq('<body>')
        })
      })
    })
  })
})
