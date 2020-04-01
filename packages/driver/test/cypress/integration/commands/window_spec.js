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
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/window', function () {
  context('#window', function () {
    it('returns the remote window', () => cy.window().then((win) => expect(win).to.eq(cy.state('$autIframe').prop('contentWindow'))))

    describe('assertion verification', function () {
      beforeEach(function () {
        this.remoteWindow = cy.state('window')

        delete this.remoteWindow.foo

        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('eventually passes the assertion', function () {
        cy.on('command:retry', _.after(2, () => {
          this.remoteWindow.foo = 'bar'
        }))

        return cy.window().should('have.property', 'foo', 'bar').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })

      it('eventually fails the assertion', function (done) {
        cy.on('command:retry', _.after(2, () => {
          this.remoteWindow.foo = 'foo'
        }))

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

        return cy.window().should('have.property', 'foo', 'bar')
      })

      it('can still fail on window', function (done) {
        const win = cy.state('window')

        cy.state('window', undefined)

        cy.on('fail', (err) => {
          cy.state('window', win)

          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(err.message).to.include(lastLog.get('error').message)
          expect(lastLog.get('name')).to.eq('window')
          expect(lastLog.get('state')).to.eq('failed')

          return done()
        })

        return cy.window()
      })

      return it('does not log an additional log on failure', function (done) {
        this.remoteWindow.foo = 'foo'

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.window().should('have.property', 'foo', 'bar')
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

      it('can turn off logging', () => {
        return cy.window({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'window') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('snapshot')).not.to.be.ok

            return done()
          }
        })

        return cy.window()
      })

      it('snapshots after resolving', () => {
        return cy.window().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can be aliased', () => {
        return cy
        .window().as('win')
        .get('body')
        .get('@win').then(function (win) {
        // window + get + get
          expect(this.logs.length).to.eq(3)

          expect(win).to.eq(this.win)

          expect(this.logs[0].get('alias')).to.eq('win')
          expect(this.logs[0].get('aliasType')).to.eq('primitive')

          expect(this.logs[2].get('aliasType')).to.eq('primitive')

          return expect(this.logs[2].get('referencesAlias').name).to.eq('win')
        })
      })

      it('logs obj', () => {
        return cy.window().then(function () {
          const obj = {
            name: 'window',
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

      return it('#consoleProps', () => {
        return cy.window().then(function (win) {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'window',
            Yielded: win,
          })
        })
      })
    })
  })

  context('#document', function () {
    it('returns the remote document as a jquery object', () => cy.document().then(($doc) => expect($doc).to.eq(cy.state('$autIframe').prop('contentDocument'))))

    describe('assertion verification', function () {
      beforeEach(function () {
        this.remoteDocument = cy.state('window').document

        delete this.remoteDocument.foo

        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('eventually passes the assertion', function () {
        cy.on('command:retry', _.after(2, () => {
          this.remoteDocument.foo = 'bar'
        }))

        return cy.document().should('have.property', 'foo', 'bar').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          return expect(lastLog.get('ended')).to.be.true
        })
      })

      it('eventually fails the assertion', function (done) {
        cy.on('command:retry', _.after(2, () => {
          this.remoteDocument.foo = 'foo'
        }))

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

        return cy.document().should('have.property', 'foo', 'bar')
      })

      it('can still fail on document', function (done) {
        const win = cy.state('window')

        cy.state('window', undefined)

        cy.on('fail', (err) => {
          cy.state('window', win)

          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(1)
          expect(err.message).to.include(lastLog.get('error').message)
          expect(lastLog.get('name')).to.eq('document')
          expect(lastLog.get('state')).to.eq('failed')

          return done()
        })

        return cy.document()
      })

      return it('does not log an additional log on failure', function (done) {
        this.remoteDocument.foo = 'foo'

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          return done()
        })

        return cy.document().should('have.property', 'foo', 'bar')
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

      it('can turn off logging', () => {
        return cy.document({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'document') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('snapshots')).not.to.be.ok

            return done()
          }
        })

        return cy.document()
      })

      it('snapshots after resolving', () => {
        return cy.document().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can be aliased', function () {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          this.log = log

          return logs.push(this.log)
        })

        return cy
        .document().as('doc')
        .get('body')
        .get('@doc').then(function (doc) {
          // docdow + get + get
          expect(this.logs.length).to.eq(3)

          expect(doc).to.eq(this.doc)

          expect(logs[0].get('alias')).to.eq('doc')
          expect(logs[0].get('aliasType')).to.eq('primitive')

          expect(logs[2].get('aliasType')).to.eq('primitive')

          return expect(logs[2].get('referencesAlias').name).to.eq('doc')
        })
      })

      it('logs obj', () => {
        return cy.document().then(function () {
          const obj = {
            name: 'document',
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

      return it('#consoleProps', () => {
        return cy.document().then(function (win) {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'document',
            Yielded: win,
          })
        })
      })
    })
  })

  context('#title', function () {
    before(() => {
      return cy
      .visit('/fixtures/generic.html')
      .then(function (win) {
        const h = $(win.document.head)

        h.find('script').remove()

        this.head = h.prop('outerHTML')
        this.body = win.document.body.outerHTML
      })
    })

    beforeEach(function () {
      const doc = cy.state('document')

      $(doc.head).empty().html(this.head)

      return $(doc.body).empty().html(this.body)
    })

    it('returns the pages title as a string', () => {
      const title = cy.$$('title').text()

      return cy.title().then((text) => expect(text).to.eq(title))
    })

    it('retries finding the title', () => {
      cy.$$('title').remove()

      const retry = _.after(2, () => {
        return cy.$$('head').append($('<title>waiting on title</title>'))
      })

      cy.on('command:retry', retry)

      return cy.title().should('eq', 'waiting on title')
    })

    it('eventually resolves', () => {
      _.delay(() => cy.$$('title').text('about page')
        , 100)

      return cy.title().should('eq', 'about page').and('match', /about/)
    })

    it('uses the first title element', () => {
      const title = cy.$$('head title').text()

      cy.$$('head').prepend('<title>some title</title>')
      cy.$$('head').prepend('<title>another title</title>')

      return cy.title().then(($title) => expect($title).to.eq('another title'))
    })

    it('uses document.title setter over <title>', () => {
      const title = cy.$$('title')

      // make sure we have a title element
      expect(title.length).to.eq(1)
      expect(title.text()).not.to.eq('foo')

      cy.state('document').title = 'foo'

      return cy.title().then((title) => expect(title).to.eq('foo'))
    })

    it('is empty string when no <title>', () => {
      cy.$$('title').remove()

      return cy.title().then(($title) => expect($title).to.eq(''))
    })

    describe('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws after timing out', (done) => {
        cy.$$('title').remove()

        cy.on('fail', (err) => {
          expect(err.message).to.include('expected \'\' to equal \'asdf\'')

          return done()
        })

        return cy.title().should('eq', 'asdf')
      })

      return it('only logs once', function (done) {
        cy.$$('title').remove()

        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(2)
          expect(err.message).to.include(lastLog.get('error').message)

          return done()
        })

        return cy.title().should('eq', 'asdf')
      })
    })

    return describe('.log', function () {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          if (log.get('name') === 'get') {
            throw new Error('`cy.get()` should not have logged out.')
          }
        })

        return null
      })

      it('can turn off logging', () => {
        return cy.title({ log: false }).then(function () {
          return expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        const input = cy.$$(':text:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'title') {
            expect(log.get('state')).to.eq('pending')

            return done()
          }
        })

        return cy.title()
      })

      it('snapshots after clicking', () => {
        return cy.title().then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        return cy.title().then(function () {
          const obj = {
            name: 'title',
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
        return cy.title().then(function () {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'title',
            Yielded: 'Generic HTML Fixture',
          })
        })
      })
    })
  })

  return context('#viewport', function () {
    it('triggers \'viewport:changed\' event with dimensions object', () => {
      let expected = false

      cy.on('viewport:changed', (viewport, fn) => {
        expected = true
        expect(viewport).to.deep.eq({ viewportWidth: 800, viewportHeight: 600 })

        return expect(fn).to.be.a('function')
      })

      return cy.viewport(800, 600).then(() => expect(expected).to.be.true)
    })

    it('does not trigger \'viewport:changed\' when changing to the default', () => {
      const fn = function () {
        throw new Error('Should not trigger \'viewport:changed\'')
      }

      Cypress.prependListener('viewport:changed', fn)

      return cy.viewport(1000, 660).then(() => Cypress.removeListener('viewport:changed', fn))
    })

    it('does not trigger \'viewport:changed\' when changing to the same viewport', () => {
      let triggeredOnce = false
      const fn = function () {
        if (triggeredOnce) {
          throw new Error('Should not trigger \'viewport:changed\'')
        }

        triggeredOnce = true
      }

      Cypress.prependListener('viewport:changed', fn)

      cy.viewport(800, 600)

      return cy.viewport(800, 600).then(() => Cypress.removeListener('viewport:changed', fn))
    })

    it('triggers \'viewport:changed\' if width changes', (done) => {
      let finished = false

      setTimeout(() => {
        if (!finished) {
          return done('Timed out before \'viewport:changed\'')
        }
      }
      , 1000)

      let triggeredOnce = false

      cy.on('viewport:changed', (viewport) => {
        if (triggeredOnce) {
          expect(viewport).to.eql({ viewportWidth: 900, viewportHeight: 600 })
          finished = true
          done()
        }

        triggeredOnce = true
      })

      cy.viewport(800, 600)

      return cy.viewport(900, 600)
    })

    it('triggers \'viewport:changed\' if height changes', (done) => {
      let finished = false

      setTimeout(() => {
        if (!finished) {
          return done('Timed out before \'viewport:changed\'')
        }
      }
      , 1000)

      let triggeredOnce = false

      cy.on('viewport:changed', (viewport) => {
        if (triggeredOnce) {
          expect(viewport).to.eql({ viewportWidth: 800, viewportHeight: 700 })
          finished = true
          done()
        }

        triggeredOnce = true
      })

      cy.viewport(800, 600)

      return cy.viewport(800, 700)
    })

    it('sets subject to null', () => cy.viewport('ipad-2').then((subject) => expect(subject).to.be.null))

    it('does not modify viewportWidth and viewportHeight in config', () => {
      let expected = false

      cy.on('viewport:changed', () => {
        expected = true
        expect(Cypress.config('viewportWidth')).not.to.eq(800)

        return expect(Cypress.config('viewportHeight')).not.to.eq(600)
      })

      return cy.viewport(800, 600).then(() => expect(expected).to.be.true)
    })

    context('changing viewport', () => {
      return it('changes viewport and then resets back to the original', () => {
        const { viewportHeight, viewportWidth } = Cypress.config()

        return cy.viewport(500, 400).then(() => {
          return Cypress.action('runner:test:before:run:async', {})
          .then(() => {
            expect(Cypress.config('viewportWidth')).to.eq(viewportWidth)

            return expect(Cypress.config('viewportHeight')).to.eq(viewportHeight)
          })
        })
      })
    })

    context('presets', () => {
      it('ipad-2', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 768, viewportHeight: 1024 })

          return done()
        })

        return cy.viewport('ipad-2')
      })

      it('ipad-mini', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 768, viewportHeight: 1024 })

          return done()
        })

        return cy.viewport('ipad-mini')
      })

      it('iphone-xr', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 896 })

          return done()
        })

        return cy.viewport('iphone-xr')
      })

      it('iphone-x', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 375, viewportHeight: 812 })

          return done()
        })

        return cy.viewport('iphone-x')
      })

      it('iphone-6+', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 736 })

          return done()
        })

        return cy.viewport('iphone-6+')
      })

      it('iphone-6', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 375, viewportHeight: 667 })

          return done()
        })

        return cy.viewport('iphone-6')
      })

      it('iphone-5', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 320, viewportHeight: 568 })

          return done()
        })

        return cy.viewport('iphone-5')
      })

      it('can change the orientation to landspace', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 568, viewportHeight: 320 })

          return done()
        })

        return cy.viewport('iphone-5', 'landscape')
      })

      it('can change the orientation to portrait', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 320, viewportHeight: 568 })

          return done()
        })

        return cy.viewport('iphone-5', 'portrait')
      })

      it('samsung-s10', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 360, viewportHeight: 760 })

          return done()
        })

        return cy.viewport('samsung-s10')
      })

      return it('samsung-note9', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 846 })

          return done()
        })

        return cy.viewport('samsung-note9')
      })
    })

    context('errors', function () {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws when passed invalid preset', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.match(/^`cy.viewport\(\)` could not find a preset for: `foo`. Available presets are: /)
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          return done()
        })

        return cy.viewport('foo')
      })

      it('throws when passed a string as height', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` can only accept a string preset or a `width` and `height` as numbers.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          return done()
        })

        return cy.viewport(800, '600')
      })

      it('throws when passed negative numbers', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` `width` and `height` must be at least 0px.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          return done()
        })

        return cy.viewport(800, -600)
      })

      it('does not throw when passed width equal to 0', () => cy.viewport(0, 600))

      it('does not throw when passed width equal to 1000000', () => cy.viewport(200, 1000000))

      it('throws when passed an empty string as width', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` cannot be passed an empty string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          return done()
        })

        return cy.viewport('')
      })

      it('throws when passed an invalid orientation on a preset', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` can only accept `landscape` or `portrait` as valid orientations. Your orientation was: `foobar`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          return done()
        })

        return cy.viewport('iphone-4', 'foobar')
      })

      return _.each([{}, [], NaN, Infinity, null, undefined], (val) => {
        return it(`throws when passed the invalid: '${val}' as width`, function (done) {
          const logs = []

          cy.on('log:added', (attrs, log) => logs.push(log))

          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(1)
            expect(err.message).to.eq('`cy.viewport()` can only accept a string preset or a `width` and `height` as numbers.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

            return done()
          })

          return cy.viewport(val)
        })
      })
    })

    return context('.log', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('logs viewport', () => {
        return cy.viewport(800, 600).then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('name')).to.eq('viewport')
        })
      })

      it('logs viewport with width, height', () => {
        return cy.viewport(800, 600).then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('message')).to.eq('800, 600')
        })
      })

      it('logs viewport with preset', () => {
        return cy.viewport('ipad-2').then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('message')).to.eq('ipad-2')
        })
      })

      it('sets state to success immediately', () => {
        return cy.viewport(800, 600).then(function () {
          const {
            lastLog,
          } = this

          return expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        return cy.viewport(800, 600).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          return expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can turn off logging viewport command', () => {
        return cy.viewport(800, 600, { log: false }).then(function () {
          return expect(this.log).not.to.be.ok
        })
      })

      it('can turn off logging viewport when using preset', () => {
        return cy.viewport('macbook-15', { log: false }).then(function () {
          return expect(this.log).not.to.be.ok
        })
      })

      it('sets viewportWidth and viewportHeight directly', () => {
        return cy.viewport(800, 600).then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('viewportWidth')).to.eq(800)

          return expect(lastLog.get('viewportHeight')).to.eq(600)
        })
      })

      it('.consoleProps with preset', () => {
        return cy.viewport('ipad-mini').then(function () {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'viewport',
            Preset: 'ipad-mini',
            Width: 768,
            Height: 1024,
          })
        })
      })

      return it('.consoleProps without preset', () => {
        return cy.viewport(1024, 768).then(function () {
          return expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'viewport',
            Width: 1024,
            Height: 768,
          })
        })
      })
    })
  })
})
