const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/window', () => {
  context('#window', () => {
    it('returns the remote window', () => cy.window().then((win) => expect(win).to.eq(cy.state('$autIframe').prop('contentWindow'))))

    describe('assertion verification', () => {
      beforeEach(() => {
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

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          this.remoteWindow.foo = 'bar'
        }))

        cy.window().should('have.property', 'foo', 'bar').then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
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

          done()
        })

        cy.window().should('have.property', 'foo', 'bar')
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

          done()
        })

        cy.window()
      })

      it('does not log an additional log on failure', function (done) {
        this.remoteWindow.foo = 'foo'

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          done()
        })

        cy.window().should('have.property', 'foo', 'bar')
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('can turn off logging', () => {
        cy.window({ log: false }).then(() => {
          expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'window') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('snapshot')).not.to.be.ok

            done()
          }
        })

        cy.window()
      })

      it('snapshots after resolving', () => {
        cy.window().then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can be aliased', () => {
        cy
        .window().as('win')
        .get('body')
        .get('@win').then(function (win) {
        // window + get + get
          expect(this.logs.length).to.eq(3)

          expect(win).to.eq(this.win)

          expect(this.logs[0].get('alias')).to.eq('win')
          expect(this.logs[0].get('aliasType')).to.eq('primitive')

          expect(this.logs[2].get('aliasType')).to.eq('primitive')

          expect(this.logs[2].get('referencesAlias').name).to.eq('win')
        })
      })

      it('logs obj', () => {
        cy.window().then(() => {
          const obj = {
            name: 'window',
            message: '',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('#consoleProps', () => {
        cy.window().then(function (win) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'window',
            Yielded: win,
          })
        })
      })
    })
  })

  context('#document', () => {
    it('returns the remote document as a jquery object', () => cy.document().then(($doc) => expect($doc).to.eq(cy.state('$autIframe').prop('contentDocument'))))

    describe('assertion verification', () => {
      beforeEach(() => {
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

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          this.remoteDocument.foo = 'bar'
        }))

        cy.document().should('have.property', 'foo', 'bar').then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
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

          done()
        })

        cy.document().should('have.property', 'foo', 'bar')
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

          done()
        })

        cy.document()
      })

      it('does not log an additional log on failure', function (done) {
        this.remoteDocument.foo = 'foo'

        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          done()
        })

        cy.document().should('have.property', 'foo', 'bar')
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('can turn off logging', () => {
        cy.document({ log: false }).then(() => {
          expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'document') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('snapshots')).not.to.be.ok

            done()
          }
        })

        cy.document()
      })

      it('snapshots after resolving', () => {
        cy.document().then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can be aliased', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          this.log = log

          return logs.push(this.log)
        })

        cy
        .document().as('doc')
        .get('body')
        .get('@doc').then(function (doc) {
          // docdow + get + get
          expect(this.logs.length).to.eq(3)

          expect(doc).to.eq(this.doc)

          expect(logs[0].get('alias')).to.eq('doc')
          expect(logs[0].get('aliasType')).to.eq('primitive')

          expect(logs[2].get('aliasType')).to.eq('primitive')

          expect(logs[2].get('referencesAlias').name).to.eq('doc')
        })
      })

      it('logs obj', () => {
        cy.document().then(() => {
          const obj = {
            name: 'document',
            message: '',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('#consoleProps', () => {
        cy.document().then(function (win) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'document',
            Yielded: win,
          })
        })
      })
    })
  })

  context('#title', () => {
    before(() => {
      cy
      .visit('/fixtures/generic.html')
      .then(function (win) {
        const h = $(win.document.head)

        h.find('script').remove()

        this.head = h.prop('outerHTML')
        this.body = win.document.body.outerHTML
      })
    })

    beforeEach(() => {
      const doc = cy.state('document')

      $(doc.head).empty().html(this.head)

      return $(doc.body).empty().html(this.body)
    })

    it('returns the pages title as a string', () => {
      const title = cy.$$('title').text()

      cy.title().then((text) => expect(text).to.eq(title))
    })

    it('retries finding the title', () => {
      cy.$$('title').remove()

      const retry = _.after(2, () => {
        cy.$$('head').append($('<title>waiting on title</title>'))
      })

      cy.on('command:retry', retry)

      cy.title().should('eq', 'waiting on title')
    })

    it('eventually resolves', () => {
      _.delay(() => cy.$$('title').text('about page')
        , 100)

      cy.title().should('eq', 'about page').and('match', /about/)
    })

    it('uses the first title element', () => {
      cy.$$('head title').text()

      cy.$$('head').prepend('<title>some title</title>')
      cy.$$('head').prepend('<title>another title</title>')

      cy.title().then(($title) => expect($title).to.eq('another title'))
    })

    it('uses document.title setter over <title>', () => {
      const title = cy.$$('title')

      // make sure we have a title element
      expect(title.length).to.eq(1)
      expect(title.text()).not.to.eq('foo')

      cy.state('document').title = 'foo'

      cy.title().then((title) => expect(title).to.eq('foo'))
    })

    it('is empty string when no <title>', () => {
      cy.$$('title').remove()

      cy.title().then(($title) => expect($title).to.eq(''))
    })

    describe('errors', () => {
      beforeEach(() => {
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

          done()
        })

        cy.title().should('eq', 'asdf')
      })

      it('only logs once', function (done) {
        cy.$$('title').remove()

        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(2)
          expect(err.message).to.include(lastLog.get('error').message)

          done()
        })

        cy.title().should('eq', 'asdf')
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          if (log.get('name') === 'get') {
            throw new Error('`cy.get()` should not have logged out.')
          }
        })

        return null
      })

      it('can turn off logging', () => {
        cy.title({ log: false }).then(() => {
          expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.$$(':text:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'title') {
            expect(log.get('state')).to.eq('pending')

            done()
          }
        })

        cy.title()
      })

      it('snapshots after clicking', () => {
        cy.title().then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj', () => {
        cy.title().then(() => {
          const obj = {
            name: 'title',
          }

          const {
            lastLog,
          } = this

          return _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value)
          })
        })
      })

      it('#consoleProps', () => {
        cy.title().then(() => {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'title',
            Yielded: 'Generic HTML Fixture',
          })
        })
      })
    })
  })

  context('#viewport', () => {
    it('triggers \'viewport:changed\' event with dimensions object', () => {
      let expected = false

      cy.on('viewport:changed', (viewport, fn) => {
        expected = true
        expect(viewport).to.deep.eq({ viewportWidth: 800, viewportHeight: 600 })

        expect(fn).to.be.a('function')
      })

      cy.viewport(800, 600).then(() => expect(expected).to.be.true)
    })

    it('does not trigger \'viewport:changed\' when changing to the default', () => {
      const fn = () => {
        throw new Error('Should not trigger \'viewport:changed\'')
      }

      Cypress.prependListener('viewport:changed', fn)

      cy.viewport(1000, 660).then(() => Cypress.removeListener('viewport:changed', fn))
    })

    it('does not trigger \'viewport:changed\' when changing to the same viewport', () => {
      let triggeredOnce = false
      const fn = () => {
        if (triggeredOnce) {
          throw new Error('Should not trigger \'viewport:changed\'')
        }

        triggeredOnce = true
      }

      Cypress.prependListener('viewport:changed', fn)

      cy.viewport(800, 600)

      cy.viewport(800, 600).then(() => Cypress.removeListener('viewport:changed', fn))
    })

    it('triggers \'viewport:changed\' if width changes', (done) => {
      let finished = false

      setTimeout(() => {
        if (!finished) {
          done('Timed out before \'viewport:changed\'')
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

      cy.viewport(900, 600)
    })

    it('triggers \'viewport:changed\' if height changes', (done) => {
      let finished = false

      setTimeout(() => {
        if (!finished) {
          done('Timed out before \'viewport:changed\'')
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

      cy.viewport(800, 700)
    })

    it('sets subject to null', () => cy.viewport('ipad-2').then((subject) => expect(subject).to.be.null))

    it('does not modify viewportWidth and viewportHeight in config', () => {
      let expected = false

      cy.on('viewport:changed', () => {
        expected = true
        expect(Cypress.config('viewportWidth')).not.to.eq(800)

        expect(Cypress.config('viewportHeight')).not.to.eq(600)
      })

      cy.viewport(800, 600).then(() => expect(expected).to.be.true)
    })

    context('changing viewport', () => {
      it('changes viewport and then resets back to the original', () => {
        const { viewportHeight, viewportWidth } = Cypress.config()

        cy.viewport(500, 400).then(() => {
          Cypress.action('runner:test:before:run:async', {})
          .then(() => {
            expect(Cypress.config('viewportWidth')).to.eq(viewportWidth)

            expect(Cypress.config('viewportHeight')).to.eq(viewportHeight)
          })
        })
      })
    })

    context('presets', () => {
      it('ipad-2', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 768, viewportHeight: 1024 })

          done()
        })

        cy.viewport('ipad-2')
      })

      it('ipad-mini', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 768, viewportHeight: 1024 })

          done()
        })

        cy.viewport('ipad-mini')
      })

      it('iphone-xr', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 896 })

          done()
        })

        cy.viewport('iphone-xr')
      })

      it('iphone-x', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 375, viewportHeight: 812 })

          done()
        })

        cy.viewport('iphone-x')
      })

      it('iphone-6+', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 736 })

          done()
        })

        cy.viewport('iphone-6+')
      })

      it('iphone-6', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 375, viewportHeight: 667 })

          done()
        })

        cy.viewport('iphone-6')
      })

      it('iphone-5', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 320, viewportHeight: 568 })

          done()
        })

        cy.viewport('iphone-5')
      })

      it('can change the orientation to landspace', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 568, viewportHeight: 320 })

          done()
        })

        cy.viewport('iphone-5', 'landscape')
      })

      it('can change the orientation to portrait', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 320, viewportHeight: 568 })

          done()
        })

        cy.viewport('iphone-5', 'portrait')
      })

      it('samsung-s10', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 360, viewportHeight: 760 })

          done()
        })

        cy.viewport('samsung-s10')
      })

      it('samsung-note9', (done) => {
        cy.on('viewport:changed', (viewport) => {
          expect(viewport).to.deep.eq({ viewportWidth: 414, viewportHeight: 846 })

          done()
        })

        cy.viewport('samsung-note9')
      })
    })

    context('errors', () => {
      beforeEach(() => {
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

          done()
        })

        cy.viewport('foo')
      })

      it('throws when passed a string as height', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` can only accept a string preset or a `width` and `height` as numbers.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          done()
        })

        cy.viewport(800, '600')
      })

      it('throws when passed negative numbers', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` `width` and `height` must be at least 0px.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          done()
        })

        cy.viewport(800, -600)
      })

      it('does not throw when passed width equal to 0', () => cy.viewport(0, 600))

      it('does not throw when passed width equal to 1000000', () => cy.viewport(200, 1000000))

      it('throws when passed an empty string as width', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` cannot be passed an empty string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          done()
        })

        cy.viewport('')
      })

      it('throws when passed an invalid orientation on a preset', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.viewport()` can only accept `landscape` or `portrait` as valid orientations. Your orientation was: `foobar`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

          done()
        })

        cy.viewport('iphone-4', 'foobar')
      })

      return _.each([{}, [], NaN, Infinity, null, undefined], (val) => {
        it(`throws when passed the invalid: '${val}' as width`, function (done) {
          const logs = []

          cy.on('log:added', (attrs, log) => logs.push(log))

          cy.on('fail', (err) => {
            expect(this.logs.length).to.eq(1)
            expect(err.message).to.eq('`cy.viewport()` can only accept a string preset or a `width` and `height` as numbers.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/viewport')

            done()
          })

          cy.viewport(val)
        })
      })
    })

    context('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('logs viewport', () => {
        cy.viewport(800, 600).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('viewport')
        })
      })

      it('logs viewport with width, height', () => {
        cy.viewport(800, 600).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('message')).to.eq('800, 600')
        })
      })

      it('logs viewport with preset', () => {
        cy.viewport('ipad-2').then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('message')).to.eq('ipad-2')
        })
      })

      it('sets state to success immediately', () => {
        cy.viewport(800, 600).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.viewport(800, 600).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('can turn off logging viewport command', () => {
        cy.viewport(800, 600, { log: false }).then(() => {
          expect(this.log).not.to.be.ok
        })
      })

      it('can turn off logging viewport when using preset', () => {
        cy.viewport('macbook-15', { log: false }).then(() => {
          expect(this.log).not.to.be.ok
        })
      })

      it('sets viewportWidth and viewportHeight directly', () => {
        cy.viewport(800, 600).then(() => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('viewportWidth')).to.eq(800)

          expect(lastLog.get('viewportHeight')).to.eq(600)
        })
      })

      it('.consoleProps with preset', () => {
        cy.viewport('ipad-mini').then(() => {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'viewport',
            Preset: 'ipad-mini',
            Width: 768,
            Height: 1024,
          })
        })
      })

      it('.consoleProps without preset', () => {
        cy.viewport(1024, 768).then(() => {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'viewport',
            Width: 1024,
            Height: 768,
          })
        })
      })
    })
  })
})
