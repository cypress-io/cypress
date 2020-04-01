const $ = Cypress.$.bind(Cypress)
const { _ } = Cypress
const { Promise } = Cypress

describe('src/cy/commands/querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#focused', () => {
    it('returns the activeElement', () => {
      const $button = cy.$$('#button')

      $button.get(0).focus()

      expect(cy.state('document').activeElement).to.eq($button.get(0))

      cy.focused().then(($focused) => {
        expect($focused.get(0)).to.eq($button.get(0))
      })
    })

    it('returns null if no activeElement', () => {
      const $button = cy.$$('#button')

      $button.get(0).focus()
      $button.get(0).blur()

      cy.focused().should('not.exist').then(($focused) => {
        expect($focused).to.be.null
      })
    })

    describe('assertion verification', () => {
      beforeEach(() => {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$(':text:first').addClass('focused').focus()
        }))

        cy.focused().should('have.class', 'focused').then(() => {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })

      // https://github.com/cypress-io/cypress/issues/409
      it('retries on an elements value', () => {
        const $input = cy.$$('input:first')

        cy.on('command:retry', _.after(2, () => {
          $input.val('1234')

          $input.get(0).focus()
        }))

        cy.focused().should('have.value', '1234').then(() => {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        cy.$$('input:first').get(0).focus()

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'focused') {
            this.lastLog = log
          }
        })

        return null
      })

      it('is a parent command', () => {
        cy.get('body').focused().then(() => {
          const { lastLog } = this

          expect(lastLog.get('type')).to.eq('parent')
        })
      })

      it('ends immediately', () => {
        cy.focused().then(() => {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true

          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.focused().then(() => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('passes in $el', () => {
        cy.get('input:first').focused().then(function ($input) {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.eq($input)
        })
      })

      it('#consoleProps', () => {
        cy.get('input:first').focused().then(function ($input) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'focused',
            Yielded: $input.get(0),
            Elements: 1,
          })
        })
      })

      it('#consoleProps with null element', () => {
        const button = cy.$$('#button')

        button.get(0).focus()
        button.get(0).blur()

        cy.focused().should('not.exist').then(() => {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'focused',
            Yielded: '--nothing--',
            Elements: 0,
          })
        })
      })
    })

    describe('errors', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        return null
      })

      it('fails waiting for the element to exist', (done) => {
        const button = cy.$$('#button')

        button.get(0).focus()
        button.get(0).blur()

        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `focused`, but never found it.')

          done()
        })

        cy.focused()
      })

      it('fails waiting for the focused element not to exist', (done) => {
        cy.$$('input:first').focus()

        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected <input#input> not to exist in the DOM, but it was continuously found.')

          done()
        })

        cy.focused().should('not.exist')
      })

      it('eventually fails the assertion', function (done) {
        cy.$$('input:first').focus()

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.focused().should('have.class', 'focused')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(2)

          done()
        })

        cy.focused().should('have.class', 'focused')
      })
    })
  })

  context('#within', () => {
    it('invokes callback function with runnable.ctx', () => {
      const ctx = this

      cy.get('div:first').within(() => {
        expect(ctx === this).to.be.true
      })
    })

    it('scopes additional GET finders to the subject', () => {
      const input = cy.$$('#by-name input:first')

      cy.get('#by-name').within(() => {
        cy.get('input:first').then(($input) => {
          expect($input.get(0)).to.eq(input.get(0))
        })
      })
    })

    it('scopes additional CONTAINS finders to the subject', () => {
      const span = cy.$$('#nested-div span:contains(foo)')

      cy.contains('foo').then(($span) => {
        expect($span.get(0)).not.to.eq(span.get(0))
      })

      cy.get('#nested-div').within(() => {
        cy.contains('foo').then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })
    })

    it('does not change the subject', () => {
      const form = cy.$$('#by-name')

      cy.get('#by-name').within(() => {}).then(($form) => {
        expect($form.get(0)).to.eq(form.get(0))
      })
    })

    it('can call child commands after within on the same subject', () => {
      const input = cy.$$('#by-name input:first')

      cy.get('#by-name').within(() => {}).find('input:first').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('supports nested withins', () => {
      const span = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })
      })
    })

    it('supports complicated nested withins', () => {
      const span1 = cy.$$('#button-text a span')
      const span2 = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('a').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span1.get(0))
          })
        })

        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span2.get(0))
          })
        })
      })
    })

    it('clears withinSubject after within is over', () => {
      const input = cy.$$('input:first')
      const span = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })
      })

      cy.get('input:first').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('removes command:start listeners after within is over', () => {
      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span')
        })
      })

      cy.then(() => {
        expect(cy._events).not.to.have.property('command:start')
      })
    })

    it('clears withinSubject even if next is null', (done) => {
      const span = cy.$$('#button-text button span')

      // should be defined here because next would have been
      // null and withinSubject would not have been cleared
      cy.once('command:queue:before:end', () => {
        expect(cy.state('withinSubject')).not.to.be.undefined
      })

      cy.once('command:queue:end', () => {
        expect(cy.state('withinSubject')).to.be.null

        done()
      })

      cy.get('#button-text').within(() => {
        cy.get('button span').then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'within') {
            this.lastLog = log

            this.logs.push(log)
          }
        })

        return null
      })

      it('can silence logging', () => {
        cy.get('div:first').within({ log: false }, () => {}).then(() => {
          expect(this.logs.length).to.eq(0)
        })
      })

      it('logs immediately before resolving', (done) => {
        const div = cy.$$('div:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'within') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('')
            expect(log.get('$el').get(0)).to.eq(div.get(0))

            done()
          }
        })

        cy.get('div:first').within(() => {})
      })

      it('snapshots after clicking', () => {
        cy.get('div:first').within(() => {})
        .then(() => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })
    })

    describe('errors', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        return null
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.noop().within(() => {})
      })

      it('throws when not a DOM subject', (done) => {
        cy.on('fail', (err) => {
          done()
        })

        cy.noop().within(() => {})
      })

      _.each(['', [], {}, 1, null, undefined], (value) => {
        it(`throws if passed anything other than a function, such as: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.within()` must be called with a function.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/within')

            done()
          })

          cy.get('body').within(value)
        })
      })

      it('throws when subject is not in the document', (done) => {
        cy.on('command:end', () => {
          cy.$$('#list').remove()
        })

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.within()` failed because this element')

          done()
        })

        cy.get('#list').within(() => {})
      })
    })
  })

  context('#root', () => {
    it('returns html', () => {
      const html = cy.$$('html')

      cy.root().then(($html) => {
        expect($html.get(0)).to.eq(html.get(0))
      })
    })

    it('returns withinSubject if exists', () => {
      const form = cy.$$('form')

      cy.get('form').within(() => {
        cy
        .get('input')
        .root().then(($root) => {
          expect($root.get(0)).to.eq(form.get(0))
        })
      })
    })

    it('eventually resolves', () => {
      _.delay(() => {
        cy.$$('html').addClass('foo').addClass('bar')
      }
      , 100)

      cy.root().should('have.class', 'foo').and('have.class', 'bar')
    })

    describe('.log', () => {
      beforeEach(() => {
        beforeEach(() => {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'root') {
              this.lastLog = log

              this.logs.push(log)
            }
          })

          return null
        })
      })

      it('can turn off logging', () => {
        cy.root({ log: false }).then(() => {
          expect(this.log).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'root') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('')

            done()
          }
        })

        cy.root()
      })

      it('snapshots after clicking', () => {
        cy.root().then(() => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('sets $el to document', () => {
        const html = cy.$$('html')

        cy.root().then(() => {
          expect(this.lastLog.get('$el').get(0)).to.eq(html.get(0))
        })
      })

      it('sets $el to withinSubject', () => {
        const form = cy.$$('form')

        cy.get('form').within(() => {
          cy
          .get('input')
          .root().then(function ($root) {
            expect(this.lastLog.get('$el').get(0)).to.eq(form.get(0))
          })
        })
      })

      it('consoleProps', () => {
        cy.root().then(function ($root) {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps).to.deep.eq({
            Command: 'root',
            Yielded: $root.get(0),
          })
        })
      })
    })
  })

  context('#get', () => {
    beforeEach(() => {
      Cypress.config('defaultCommandTimeout', 200)
    })

    it('finds by selector', () => {
      const list = cy.$$('#list')

      cy.get('#list').then(($list) => {
        expect($list.get(0)).to.eq(list.get(0))
      })
    })

    // NOTE: FLAKY in CI, need to investigate further
    it.skip('retries finding elements until something is found', () => {
      const missingEl = $('<div />', { id: 'missing-el' })

      // wait until we're ALMOST about to time out before
      // appending the missingEl
      cy.on('command:retry', (options) => {
        if ((options.total + (options._interval * 4)) > options._runnableTimeout) {
          cy.$$('body').append(missingEl)
        }
      })

      cy.get('#missing-el').then(($div) => {
        expect($div).to.match(missingEl)
      })
    })

    it('can increase the timeout', () => {
      const missingEl = $('<div />', { id: 'missing-el' })

      cy.on('command:retry', _.after(2, (options) => {
        // make sure runnableTimeout is 10secs
        expect(options._runnableTimeout).to.eq(10000)

        // we shouldnt have a timer either
        cy.$$('body').append(missingEl)
      }))

      cy.get('#missing-el', { timeout: 10000 })
    })

    it('does not factor in the total time the test has been running', () => {
      const missingEl = $('<div />', { id: 'missing-el' })

      cy.on('command:retry', _.after(2, () => {
        cy.$$('body').append(missingEl)
      }))

      const defaultCommandTimeout = Cypress.config('defaultCommandTimeout')

      // in this example our test has been running 300ms
      // but the default command timeout is below this amount,
      // and the test still passes because the timeout is only
      // into each command and not the total overall running time
      cy
      .wait(defaultCommandTimeout + 100)
      .get('#missing-el', { timeout: defaultCommandTimeout + 50 })
      // it should reset the timeout back
      // to 200 after successfully finishing 'get' method
      .then(() => {
        expect(cy.timeout()).to.eq(defaultCommandTimeout)
      })
    })

    it('cancels existing promises', (done) => {
      cy.stub(Cypress.runner, 'stop')

      let retrys = 0

      const stop = _.after(2, () => {
        Cypress.stop()
      })

      cy.on('stop', () => {
        _.delay(() => {
          expect(retrys).to.eq(2)

          done()
        }
        , 100)
      })

      cy.on('command:retry', () => {
        retrys += 1

        stop()
      })

      cy.get('doesNotExist')
    })

    describe('custom elements', () => {
      // <foobarbazquux>custom element</foobarbazquux>

      it('can get a custom element', () => {
        cy.get('foobarbazquux').should('contain', 'custom element')
      })

      it('can alias a custom element', () => {
        cy
        .get('foobarbazquux:last').as('foo')
        .get('div:first')
        .get('@foo').should('contain', 'custom element')
      })

      it('can find a custom alias again when detached from DOM', () => {
        cy
        .get('foobarbazquux:last').as('foo')
        .then(() => {
        // remove the existing foobarbazquux
          cy.$$('foobarbazquux').remove()

          // and cause it to be re-rendered
          cy.$$('body').append(cy.$$('<foobarbazquux>asdf</foobarbazquux>'))
        }).get('@foo').should('contain', 'asdf')
      })
    })

    describe('should(\'exist\')', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 1000)
      })

      it('waits until button exists', () => {
        cy.on('command:retry', _.after(3, () => {
          cy.$$('body').append($('<div id=\'missing-el\'>missing el</div>'))
        }))

        cy.get('#missing-el').should('exist')
      })
    })

    describe('should(\'not.exist\')', () => {
      it('waits until button does not exist', () => {
        cy.timeout(500, true)

        cy.on('command:retry', _.after(2, () => {
          cy.$$('#button').remove()
        }))

        cy.get('#button').should('not.exist')
      })

      it('returns null when cannot find element', () => {
        cy.get('#missing-el').should('not.exist').then(($el) => {
          expect($el).to.be.null
        })
      })

      it('retries until cannot find element', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        const retry = _.after(3, () => {
          cy.$$('#list li:last').remove()
        })

        cy.on('command:retry', retry)

        cy.get('#list li:last').should('not.exist').then(($el) => {
          expect($el).to.be.null
        })
      })
    })

    describe('visibility is unopinionated', () => {
      it('finds invisible elements by default', () => {
        const button = cy.$$('#button').hide()

        cy.get('#button').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'not.be.visible\')', () => {
      it('returns invisible element', () => {
        const button = cy.$$('#button').hide()

        // cy.get("#button").then ($button) ->
        // expect($button).not.to.be.visible

        cy.get('#button').should('not.be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })

      it('retries until element is invisible', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        let button = null

        const retry = _.after(3, () => {
          button = cy.$$('#button').hide()
        })

        cy.on('command:retry', retry)

        cy.get('#button').should('not.be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'be.visible\')', () => {
      it('returns visible element', () => {
        const button = cy.$$('#button')

        cy.get('#button').should('be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })

      it('retries until element is visible', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        const button = cy.$$('#button').hide()

        const retry = _.after(3, () => {
          button.show()
        })

        cy.on('command:retry', retry)

        cy.get('#button').should('be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'have.length\', n)', () => {
      it('resolves once length equals n', () => {
        const forms = cy.$$('form')

        cy.get('form').should('have.length', forms.length).then(($forms) => {
          expect($forms.length).to.eq(forms.length)
        })
      })

      it('retries until length equals n', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        let buttons = cy.$$('button')

        const length = buttons.length - 2

        cy.on('command:retry', _.after(2, () => {
          buttons.last().remove()
          buttons = cy.$$('button')
        }))

        // should resolving after removing 2 buttons
        cy.get('button').should('have.length', length).then(($buttons) => {
          expect($buttons.length).to.eq(length)
        })
      })

      it('retries an alias when not enough elements found', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        const buttons = cy.$$('button')

        const length = buttons.length + 1

        // add another button after 2 retries, once
        cy.on('command:retry', _.after(2, _.once(() => {
          $('<button />').appendTo(cy.$$('body'))
        })))

        // should eventually resolve after adding 1 button
        cy
        .get('button').as('btns')
        .get('@btns').should('have.length', length).then(($buttons) => {
          expect($buttons.length).to.eq(length)
        })
      })

      it('retries an alias when too many elements found without replaying commands', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        let buttons = cy.$$('button')

        const length = buttons.length - 2

        const replayCommandsFrom = cy.spy(cy, 'replayCommandsFrom')

        cy.on('command:retry', () => {
          buttons.last().remove()
          buttons = cy.$$('button')
        })

        const existingLen = cy.queue.length

        // should eventually resolve after adding 1 button
        cy
        .get('button').as('btns')
        .get('@btns').should('have.length', length).then(($buttons) => {
          expect(replayCommandsFrom).not.to.be.called

          // get, as, get, should, then == 5
          expect(cy.queue.length - existingLen).to.eq(5) // we should not have replayed any commands

          expect($buttons.length).to.eq(length)
        })
      })
    })

    describe('assertion verification', () => {
      it('automatically retries', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$('button:first').attr('data-foo', 'bar')
        }))

        cy.get('button:first').should('have.attr', 'data-foo').and('match', /bar/)
      })

      it('eventually resolves an alias', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$('button:first').addClass('foo-bar-baz')
        }))

        cy
        .get('button:first').as('btn')
        .get('@btn').should('have.class', 'foo-bar-baz')
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            this.lastLog = log

            this.logs.push(log)
          }
        })

        return null
      })

      it('logs elements length', () => {
        let buttons = cy.$$('button')

        const length = buttons.length - 2

        // add 500ms to the delta
        cy.timeout(500, true)

        cy.on('command:retry', () => {
          buttons.last().remove()
          buttons = cy.$$('button')
        })

        // should resolving after removing 2 buttons
        cy.get('button').should('have.length', length).then(function ($buttons) {
          expect(this.lastLog.get('numElements')).to.eq(length)
        })
      })

      it('logs exist: false', () => {
        cy.get('#does-not-exist').should('not.exist').then(() => {
          expect(this.lastLog.get('message')).to.eq('#does-not-exist')

          expect(this.lastLog.get('$el').get(0)).not.to.be.ok
        })
      })

      it('logs route aliases', () => {
        cy.visit('http://localhost:3500/fixtures/jquery.html')
        cy.server()
        cy.route(/users/, {}).as('get.users')
        cy.window().then({ timeout: 2000 }, (win) => {
          win.$.get('/users')
        })

        cy.get('@get.users').then(() => {
          expect(this.lastLog.pick('message', 'referencesAlias', 'aliasType')).to.deep.eq({
            message: '@get.users',
            referencesAlias: { name: 'get.users' },
            aliasType: 'route',
          })
        })
      })

      it('logs primitive aliases', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            expect(log.pick('$el', 'numRetries', 'referencesAlias', 'aliasType')).to.deep.eq({
              referencesAlias: { name: 'f' },
              aliasType: 'primitive',
            })

            done()
          }
        })

        cy
        .noop('foo').as('f')
        .get('@f')
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            expect(log.pick('state', 'referencesAlias', 'aliasType')).to.deep.eq({
              state: 'pending',
              referencesAlias: undefined,
              aliasType: 'dom',
            })

            done()
          }
        })

        cy.get('body')
      })

      it('snapshots and ends when consuming an alias', () => {
        cy
        .get('body').as('b')
        .get('@b').then(() => {
          expect(this.lastLog.get('ended')).to.be.true
          expect(this.lastLog.get('state')).to.eq('passed')
          expect(this.lastLog.get('snapshots').length).to.eq(1)

          expect(this.lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('logs obj once complete', () => {
        cy.get('body').as('b').then(function ($body) {
          const obj = {
            state: 'passed',
            name: 'get',
            message: 'body',
            alias: 'b',
            aliasType: 'dom',
            referencesAlias: undefined,
          }

          expect(this.lastLog.get('$el').get(0)).to.eq($body.get(0))

          _.each(obj, (value, key) => {
            expect(this.lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`)
          })
        })
      })

      it('#consoleProps', () => {
        cy.get('body').then(function ($body) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'get',
            Selector: 'body',
            Yielded: $body.get(0),
            Elements: 1,
          })
        })
      })

      it('#consoleProps with an alias', () => {
        cy.get('body').as('b').get('@b').then(function ($body) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'get',
            Alias: '@b',
            Yielded: $body.get(0),
            Elements: 1,
          })
        })
      })

      it('#consoleProps with a primitive alias', () => {
        cy.noop({ foo: 'foo' }).as('obj').get('@obj').then(function (obj) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'get',
            Alias: '@obj',
            Yielded: obj,
          })
        })
      })

      it('#consoleProps with a route alias', () => {
        cy
        .server()
        .route(/users/, {}).as('getUsers')
        .visit('http://localhost:3500/fixtures/jquery.html')
        .window().then({ timeout: 2000 }, (win) => {
          return win.$.get('/users')
        }).get('@getUsers').then(function (obj) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'get',
            Alias: '@getUsers',
            Yielded: obj,
          })
        })
      })
    })

    describe('alias references', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 100)
      })

      it('can get alias primitives', () => {
        cy
        .noop('foo').as('f')
        .get('@f').then((foo) => {
          expect(foo).to.eq('foo')
        })
      })

      it('can get alias objects', () => {
        cy
        .noop({}).as('obj')
        .get('@obj').then((obj) => {
          expect(obj).to.deep.eq({})
        })
      })

      it('re-queries for an existing alias', () => {
        const body = cy.$$('body')

        cy.get('body').as('b').get('@b').then(($body) => {
          expect($body.get(0)).to.eq(body.get(0))
        })
      })

      it('re-queries the dom if any element in an alias isnt in the document', () => {
        cy.$$('input')

        cy
        .get('input').as('inputs').then(function ($inputs) {
          this.length = $inputs.length

          // remove the last input
          $inputs.last().remove()

          // return original subject
          return $inputs
        }).get('@inputs').then(function ($inputs) {
          // we should have re-queried for these inputs
          // which should have reduced their length by 1
          expect($inputs).to.have.length(this.length - 1)
        })
      })

      describe('route aliases', () => {
        it('returns the xhr', () => {
          cy
          .server()
          .route(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .window().then({ timeout: 2000 }, (win) => {
            return win.$.get('/users')
          }).get('@getUsers').then((xhr) => {
            expect(xhr.url).to.include('/users')
          })
        })

        it('handles dots in alias name', () => {
          cy.server()
          cy.route(/users/, {}).as('get.users')
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.window().then({ timeout: 2000 }, (win) => {
            return win.$.get('/users')
          })

          cy.get('@get.users').then((xhr) => {
            expect(xhr.url).to.include('/users')
          })
        })

        it('returns null if no xhr is found', () => {
          cy
          .server()
          .route(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .get('@getUsers').then((xhr) => {
            expect(xhr).to.be.null
          })
        })

        it('returns an array of xhrs', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .server()
          .route(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).get('@getUsers.all').then((xhrs) => {
            expect(xhrs).to.be.an('array')
            expect(xhrs[0].url).to.include('/users?num=1')

            expect(xhrs[1].url).to.include('/users?num=2')
          })
        })

        it('returns an array of xhrs when dots in alias name', () => {
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.server()
          cy.route(/users/, {}).as('get.users')
          cy.window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          })

          cy.get('@get.users.all').then((xhrs) => {
            expect(xhrs).to.be.an('array')
            expect(xhrs[0].url).to.include('/users?num=1')

            expect(xhrs[1].url).to.include('/users?num=2')
          })
        })

        it('returns the 1st xhr', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .server()
          .route(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).get('@getUsers.1').then((xhr1) => {
            expect(xhr1.url).to.include('/users?num=1')
          })
        })

        it('returns the 2nd xhr', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .server()
          .route(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).get('@getUsers.2').then((xhr2) => {
            expect(xhr2.url).to.include('/users?num=2')
          })
        })

        it('returns the 2nd xhr when dots in alias', () => {
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.server()
          cy.route(/users/, {}).as('get.users')
          cy.window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          })

          cy.get('@get.users.2').then((xhr2) => {
            expect(xhr2.url).to.include('/users?num=2')
          })
        })

        it('returns the 3rd xhr as null', () => {
          cy
          .server()
          .route(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).get('@getUsers.3').then((xhr3) => {
            expect(xhr3).to.be.null
          })
        })
      })
    })

    // it "re-queries the dom if any element in an alias isnt visible", ->
    //   inputs = cy.$$("input")
    //   inputs.hide()

    //   cy
    //     .get("input", {visible: false}).as("inputs").then ($inputs) ->
    //       @length = $inputs.length

    //       ## show the inputs
    //       $inputs.show()

    //       return $inputs
    //     .get("@inputs").then ($inputs) ->
    //       ## we should have re-queried for these inputs
    //       ## which should have increased their length by 1
    //       expect($inputs).to.have.length(@length)

    // these other tests are for .save
    // it "will resolve deferred arguments", ->
    //   df = $.Deferred()

    //   _.delay ->
    //     df.resolve("iphone")
    //   , 100

    //   cy.get("input:text:first").type(df).then ($input) ->
    //     expect($input).to.have.value("iphone")

    // it "handles saving subjects", ->
    //   cy.noop({foo: "foo"}).assign("foo").noop(cy.get("foo")).then (subject) ->
    //     expect(subject).to.deep.eq {foo: "foo"}

    // it "resolves falsy arguments", ->
    //   cy.noop(0).assign("zero").then ->
    //     expect(cy.get("zero")).to.eq 0

    // it "returns a function when no alias was found", ->
    //   cy.noop().then ->
    //     expect(cy.get("something")).to.be.a("function")

    describe('errors', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 50)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            this.lastLog = log

            this.logs.push(log)
          }
        })

        return null
      })

      it('throws once when incorrect sizzle selector', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)

          done()
        })

        cy.get('.spinner\'')
      })

      it('throws on too many elements after timing out waiting for length', (done) => {
        const buttons = cy.$$('button')

        cy.on('fail', (err) => {
          expect(err.message).to.include(`Too many elements found. Found '${buttons.length}', expected '${buttons.length - 1}'.`)

          done()
        })

        cy.get('button').should('have.length', buttons.length - 1)
      })

      it('throws on too few elements after timing out waiting for length', (done) => {
        const buttons = cy.$$('button')

        cy.on('fail', (err) => {
          expect(err.message).to.include(`Not enough elements found. Found '${buttons.length}', expected '${buttons.length + 1}'.`)

          done()
        })

        cy.get('button').should('have.length', buttons.length + 1)
      })

      it('throws after timing out not finding element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el')
      })

      it('throws after timing out not finding element when should exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el').should('exist')
      })

      it('throws existence error without running assertions', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el').should('have.prop', 'foo')
      })

      it('throws when using an alias that does not exist')

      it('throws after timing out after a .wait() alias reference', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `getJsonButton`, but never found it.')

          done()
        })

        cy
        .server()
        .route(/json/, { foo: 'foo' }).as('getJSON')
        .visit('http://localhost:3500/fixtures/xhr.html').then(() => {
          cy.$$('#get-json').click(() => {
            cy.timeout(1000)

            const retry = _.after(3, _.once(() => {
              cy.state('window').$.getJSON('/json')
            }))

            cy.on('command:retry', retry)
          })
        }).get('#get-json').as('getJsonButton').click()
        .wait('@getJSON')
        .get('getJsonButton')
      })

      it('throws after timing out while not trying to find an element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected <div#dom> not to exist in the DOM, but it was continuously found.')

          done()
        })

        cy.get('div:first').should('not.exist')
      })

      it('throws after timing out while trying to find an invisible element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('expected \'<div#dom>\' not to be \'visible\'')

          done()
        })

        cy.get('div:first').should('not.be.visible')
      })

      it('does not include message about why element was not visible', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).not.to.include('why this element is not visible')

          done()
        })

        cy.get('div:first').should('not.be.visible')
      })

      it('throws after timing out trying to find a visible element', (done) => {
        cy.$$('#button').hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('This element `<button#button>` is not visible because it has CSS property: `display: none`')

          done()
        })

        cy.get('#button').should('be.visible')
      })

      it('includes a message about why the element was not visible', (done) => {
        cy.$$('#button').hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('element `<button#button>` is not visible because')

          done()
        })

        cy.get('#button').should('be.visible')
      })

      it('sets error command state', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.get('foobar')
      })

      it('throws when alias property is `0`', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`0` is not a valid alias property. Are you trying to ask for the first response? If so write `@getUsers.1`')

          done()
        })

        cy
        .server()
        .route(/users/, {}).as('getUsers')
        .get('@getUsers.0')
      })

      it('throws when alias property isnt just a digit', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`1b` is not a valid alias property. Only `numbers` or `all` is permitted.')

          done()
        })

        cy
        .server()
        .route(/users/, {}).as('getUsers')
        .get('@getUsers.1b')
      })

      it('throws when alias property isnt a digit or `all`', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`all ` is not a valid alias property. Only `numbers` or `all` is permitted.')

          done()
        })

        cy
        .server()
        .route(/users/, {}).as('getUsers')
        .get('@getUsers.all ')
      })

      _.each(['', 'foo', [], 1, null], (value) => {
        it(`throws when options property is not an object. Such as: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include(`only accepts an options object for its second argument. You passed ${value}`)

            done()
          })

          cy.get('foobar', value)
        })
      })

      it('logs out $el when existing $el is found even on failure', function (done) {
        const button = cy.$$('#button').hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('$el').get(0)).to.eq(button.get(0))
          const consoleProps = lastLog.invoke('consoleProps')

          expect(consoleProps.Yielded).to.eq(button.get(0))
          expect(consoleProps.Elements).to.eq(button.length)

          done()
        })

        cy.get('#button').should('be.visible')
      })
    })
  })

  context('#contains', () => {
    it('is scoped to the body and will not return title elements', () => {
      cy.contains('DOM Fixture').then(($el) => {
        expect($el).not.to.match('title')
      })
    })

    it('will not find script elements', () => {
      cy.$$('<script>// some-script-content </script>').appendTo(cy.$$('body'))

      cy.contains('some-script-content').should('not.match', 'script')
    })

    it('will not find style elements', () => {
      cy.$$('<style> some-style-content {} </style>').appendTo(cy.$$('body'))

      cy.contains('some-style-content').should('not.match', 'style')
    })

    it('finds the nearest element by :contains selector', () => {
      cy.contains('li 0').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('li')
      })
    })

    it('resets the subject between chain invocations', () => {
      const span = cy.$$('.k-in:contains(Quality Control):last')
      const label = cy.$$('#complex-contains label')

      cy.get('#complex-contains').contains('nested contains').then(($label) => {
        expect($label.get(0)).to.eq(label.get(0))

        return $label
      })

      cy.contains('Quality Control').then(($span) => {
        expect($span.get(0)).to.eq(span.get(0))
      })
    })

    it('GET is scoped to the current subject', () => {
      const span = cy.$$('#click-me a span')

      cy.get('#click-me a').contains('click').then(($span) => {
        expect($span.length).to.eq(1)

        expect($span.get(0)).to.eq(span.get(0))
      })
    })

    it('can find input type=submits by value', () => {
      cy.contains('input contains submit').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('input[type=submit]')
      })
    })

    it('has an optional filter argument', () => {
      cy.contains('ul', 'li 0').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('ul')
      })
    })

    it('disregards priority elements when provided a filter', () => {
      const form = cy.$$('#click-me')

      cy.contains('form', 'click me').then(($form) => {
        expect($form.get(0)).to.eq(form.get(0))
      })
    })

    it('searches all els in comma separated filter', () => {
      cy.contains('a,button', 'Naruto').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('a')
      })

      cy.contains('a,button', 'Boruto').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('button')
      })
    })

    it('searches all els in comma separated filter with spaces', () => {
      const aText = 'Naruto'
      const bText = 'Boruto'

      cy.contains('a, button', aText).then(($el) => {
        expect($el.length).to.eq(1)
        expect($el).to.match('a')

        expect($el.text()).to.eq(aText)
      })

      cy.contains('a, button', bText).then(($el) => {
        expect($el.length).to.eq(1)
        expect($el).to.match('button')

        expect($el.text()).to.eq(bText)
      })
    })

    it('favors input type=submit', () => {
      const input = cy.$$('#input-type-submit input')

      cy.contains('click me').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('favors buttons next', () => {
      const button = cy.$$('#button-inside-a button')

      cy.contains('click button').then(($btn) => {
        expect($btn.get(0)).to.eq(button.get(0))
      })
    })

    it('favors anchors next', () => {
      cy.contains('Home Page').then(($el) => {
        expect($el.length).to.eq(1)

        expect($el).to.match('a')
      })
    })

    it('reduces right by priority element', () => {
      const label = cy.$$('#complex-contains label')

      // it should find label because label is the first priority element
      // out of the collection of contains elements
      cy.get('#complex-contains').contains('nested contains').then(($label) => {
        expect($label.get(0)).to.eq(label.get(0))
      })
    })

    it('retries until content is found', () => {
      const span = $('<span>brand new content</span>')

      // only append the span after we retry
      // three times
      const retry = _.after(3, () => {
        cy.$$('body').append(span)
      })

      cy.on('command:retry', retry)

      cy.contains('brand new content').then(($span) => {
        expect($span.get(0)).to.eq(span.get(0))
      })
    })

    it('finds the furthest descendent when filter matches more than 1 element', () => {
      cy
      .get('#contains-multiple-filter-match').contains('li', 'Maintenance').then(($row) => {
        expect($row).to.have.class('active')
      })
    })

    it('returns the parent node which contains content spanned across a child element and text node', () => {
      const item = cy.$$('#upper .item')

      cy.contains('New York').then(($item) => {
        expect($item).to.be.ok

        expect($item.get(0)).to.eq(item.get(0))
      })
    })

    it('finds text by regexp and restores contains', () => {
      const { contains } = Cypress.$Cypress.$.expr[':']

      cy.contains(/^asdf \d+/).then(($li) => {
        expect($li).to.have.text('asdf 1')

        expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)
      })
    })

    it('finds text by regexp when second parameter is a regexp and restores contains', () => {
      const { contains } = Cypress.$Cypress.$.expr[':']

      cy.contains('#asdf>li:first', /asdf 1/).then(($li) => {
        expect($li).to.have.text('asdf 1')

        expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)
      })
    })

    it('returns elements found first when multiple siblings found', () => {
      cy.contains('li', 'asdf').then(($li) => {
        expect($li).to.have.text('asdf 1')
      })
    })

    it('returns first ul when multiple uls', () => {
      cy.contains('ul', 'jkl').then(($ul) => {
        expect($ul.find('li:first')).to.have.text('jkl 1')
      })
    })

    it('cancels existing promises', (done) => {
      let retrys = 0

      cy.stub(Cypress.runner, 'stop')

      const abort = _.after(2, () => {
        cy.spy(cy, 'now')

        Cypress.stop()
      })

      cy.on('stop', () => {
        _.delay(() => {
          expect(cy.now).not.to.be.called
          expect(retrys).to.eq(2)

          done()
        }
        , 50)
      })

      cy.on('command:retry', () => {
        retrys += 1

        abort()
      })

      cy.contains('DOES NOT CONTAIN THIS!')
    })

    describe('should(\'not.exist\')', () => {
      it('returns null when no content exists', () => {
        cy.contains('alksjdflkasjdflkajsdf').should('not.exist').then(($el) => {
          expect($el).to.be.null
        })
      })
    })

    describe('should(\'be.visible\')', () => {
      it('returns invisible element', () => {
        const span = cy.$$('#not-hidden').hide()

        cy.contains('span', 'my hidden content').should('not.be.visible').then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })

      it('returns invisible element when parent chain is visible', () => {
        cy.get('#form-header-region').contains('Back').should('not.be.visible')
      })
    })

    describe('handles whitespace', () => {
      it('finds el with new lines', () => {
        const btn = $(`\
<button id="whitespace1">
White
space
</button>\
`).appendTo(cy.$$('body'))

        cy.get('#whitespace1').contains('White space')
        cy.contains('White space').then(($btn) => {
          expect($btn.get(0)).to.eq(btn.get(0))
        })
      })

      it('finds el with new lines + spaces', () => {
        const btn = $(`\
<button id="whitespace2">
White
space
</button>\
`).appendTo(cy.$$('body'))

        cy.get('#whitespace2').contains('White space')
        cy.contains('White space').then(($btn) => {
          expect($btn.get(0)).to.eq(btn.get(0))
        })
      })

      it('finds el with multiple spaces', () => {
        const btn = $(`\
<button id="whitespace3">
White   space
</button>\
`).appendTo(cy.$$('body'))

        cy.get('#whitespace3').contains('White space')
        cy.contains('White space').then(($btn) => {
          expect($btn.get(0)).to.eq(btn.get(0))
        })
      })

      it('finds el with regex', () => {
        const btn = $(`\
<button id="whitespace4">
White   space
</button>\
`).appendTo(cy.$$('body'))

        cy.get('#whitespace4').contains('White space')
        cy.contains(/White space/).then(($btn) => {
          expect($btn.get(0)).to.eq(btn.get(0))
        })
      })

      it('does not normalize text in pre tag', () => {
        $(`\
<pre id="whitespace5">
White
space
</pre>\
`).appendTo(cy.$$('body'))

        cy.contains('White space').should('not.match', 'pre')
        cy.get('#whitespace5').contains('White\nspace')
      })

      it('finds el with leading/trailing spaces', () => {
        const btn = $(`<button id="whitespace6">        White   space             </button>`).appendTo(cy.$$('body'))

        cy.get('#whitespace6').contains('White space')
        cy.contains('White space').then(($btn) => {
          expect($btn.get(0)).to.eq(btn.get(0))
        })
      })
    })

    describe('case sensitivity', () => {
      beforeEach(() => {
        $('<button id="test-button">Test</button>').appendTo(cy.$$('body'))
      })

      it('is case sensitive when matchCase is undefined', () => {
        cy.get('#test-button').contains('Test')
      })

      it('is case sensitive when matchCase is true', () => {
        cy.get('#test-button').contains('Test', {
          matchCase: true,
        })
      })

      it('is case insensitive when matchCase is false', () => {
        cy.get('#test-button').contains('test', {
          matchCase: false,
        })

        cy.get('#test-button').contains(/Test/, {
          matchCase: false,
        })
      })

      it('does not crash when matchCase: false is used with regex flag, i', () => {
        cy.get('#test-button').contains(/Test/i, {
          matchCase: false,
        })
      })

      it('throws when content has "i" flag while matchCase: true', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('You passed a regular expression with the case-insensitive (_i_) flag and `{ matchCase: true }` to `cy.contains()`. Those options conflict with each other, so please choose one or the other.')

          done()
        })

        cy.get('#test-button').contains(/Test/i, {
          matchCase: true,
        })
      })

      it('passes when "i" flag is used with undefined option', () => {
        cy.get('#test-button').contains(/Test/i)
      })
    })

    describe('subject contains text nodes', () => {
      it('searches for content within subject', () => {
        const badge = cy.$$('#edge-case-contains .badge:contains(5)')

        cy.get('#edge-case-contains').find('.badge').contains(5).then(($badge) => {
          expect($badge.get(0)).to.eq(badge.get(0))
        })
      })

      it('returns the first element when subject contains multiple elements', () => {
        const badge = cy.$$('#edge-case-contains .badge-multi:contains(1)')

        cy.get('#edge-case-contains').find('.badge-multi').contains(1).then(($badge) => {
          expect($badge.length).to.eq(1)

          expect($badge.get(0)).to.eq(badge.get(0))
        })
      })

      it('returns the subject when it has a text node of matching content', () => {
        const count = cy.$$('#edge-case-contains .count:contains(2)')

        cy.get('#edge-case-contains').find('.count').contains(2).then(($count) => {
          expect($count.length).to.eq(1)

          expect($count.get(0)).to.eq(count.get(0))
        })
      })

      it('retries until it finds the subject has the matching text node', () => {
        const count = $('<span class=\'count\'>100</span>')
        let retried3Times = false

        // make sure it retries 3 times.
        const retry = _.after(3, () => {
          retried3Times = true

          cy.$$('#edge-case-contains').append(count)
        })

        cy.on('command:retry', retry)

        cy.get('#edge-case-contains').contains(100).then(($count) => {
          expect(retried3Times).to.be.true
          expect($count.length).to.eq(1)

          expect($count.get(0)).to.eq(count.get(0))
        })
      })

      it('retries until it finds a filtered contains has the matching text node', () => {
        const count = $('<span class=\'count\'>100</span>')
        let retried3Times = false

        const retry = _.after(3, () => {
          retried3Times = true

          cy.$$('#edge-case-contains').append(count)
        })

        cy.on('command:retry', retry)

        cy.get('#edge-case-contains').contains('.count', 100).then(($count) => {
          expect(retried3Times).to.be.true
          expect($count.length).to.eq(1)

          expect($count.get(0)).to.eq(count.get(0))
        })
      })

      it('returns the first matched element when multiple match and there is no filter', () => {
        const icon = cy.$$('#edge-case-contains i:contains(25)')

        cy.get('#edge-case-contains').contains(25).then(($icon) => {
          expect($icon.length).to.eq(1)

          expect($icon.get(0)).to.eq(icon.get(0))
        })
      })
    })

    describe('special characters', () => {
      _.each('\' " [ ] { } . @ # $ % ^ & * ( ) , ; :'.split(' '), (char) => {
        it(`finds content by string with character: ${char}`, () => {
          const span = $(`<span>special char ${char} content</span>`).appendTo(cy.$$('body'))

          cy.contains('span', char).then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })

        it(`finds content by regex with character: ${char}`, () => {
          const span = $(`<span>special char ${char} content</span>`).appendTo(cy.$$('body'))

          cy.contains('span', new RegExp(_.escapeRegExp(char))).then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })
      })
    })

    describe('.log', () => {
      beforeEach(() => {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'contains') {
            this.lastLog = log
          }

          this.logs.push(log)
        })

        return null
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'contains') {
            expect(log.pick('state', 'type')).to.deep.eq({
              state: 'pending',
              type: 'child',
            })

            done()
          }
        })

        cy.get('body').contains('foo')
      })

      it('snapshots and ends after finding element', () => {
        cy.contains('foo').then(() => {
          expect(this.lastLog.get('ended')).to.be.true
          expect(this.lastLog.get('state')).to.eq('passed')
          expect(this.lastLog.get('snapshots').length).to.eq(1)

          expect(this.lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      // GOOD: [ {name: get} , {name: contains} ]
      // BAD:  [ {name: get} , {name: get} , {name: contains} ]
      it('silences internal cy.get() log', () => {
        cy.get('#complex-contains').contains('nested contains').then(function ($label) {
          const names = _.map(this.logs, (log) => log.get('name'))

          expect(this.logs.length).to.eq(2)

          expect(names).to.deep.eq(['get', 'contains'])
        })
      })

      it('passes in $el', () => {
        cy.get('#complex-contains').contains('nested contains').then(function ($label) {
          expect(this.lastLog.get('$el').get(0)).to.eq($label.get(0))
        })
      })

      it('sets type to parent when subject isnt element', () => {
        cy.window().contains('foo').then(() => {
          expect(this.lastLog.get('type')).to.eq('parent')

          cy.document().contains('foo').then(() => {
            expect(this.lastLog.get('type')).to.eq('parent')
          })
        })
      })

      it('sets type to child when used as a child command', () => {
        cy.get('body').contains('foo').then(() => {
          expect(this.lastLog.get('type')).to.eq('child')
        })
      })

      it('logs when not exists', () => {
        cy.contains('does-not-exist').should('not.exist').then(() => {
          expect(this.lastLog.get('message')).to.eq('does-not-exist')

          expect(this.lastLog.get('$el').length).to.eq(0)
        })
      })

      it('logs when should be visible with filter', () => {
        cy.contains('div', 'Nested Find').should('be.visible').then(function ($div) {
          expect(this.lastLog.get('message')).to.eq('div, Nested Find')

          expect(this.lastLog.get('$el').get(0)).to.eq($div.get(0))
        })
      })

      it('#consoleProps', () => {
        const $complex = cy.$$('#complex-contains')

        cy.get('#complex-contains').contains('nested contains').then(function ($label) {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps).to.deep.eq({
            Command: 'contains',
            Content: 'nested contains',
            'Applied To': $complex.get(0),
            Yielded: $label.get(0),
            Elements: 1,
          })
        })
      })
    })

    describe('errors', () => {
      beforeEach(() => {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'contains') {
            this.lastLog = log

            this.logs.push(log)
          }
        })

        return null
      })

      _.each([undefined, null], (val) => {
        it(`throws when text is ${val}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.contains()` can only accept a string, number or regular expression.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

            done()
          })

          cy.contains(val)
        })
      })

      it('throws on a blank string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.contains()` cannot be passed an empty string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

          done()
        })

        cy.contains('')
      })

      it('logs once on error', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)

          done()
        })

        cy.contains(undefined)
      })

      it('throws when passed a subject not an element', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.wrap('foo').contains('bar')
      })

      it('throws when there is no filter and no subject', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find content: \'brand new content\' but never did.')

          done()
        })

        cy.contains('brand new content')
      })

      it('throws when there is a filter', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find content: \'brand new content\' within the selector: \'span\' but never did.')

          done()
        })

        cy.contains('span', 'brand new content')
      })

      it('throws when there is no filter but there is a subject', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find content: \'0\' within the element: <div.badge> but never did.')

          done()
        })

        cy.get('#edge-case-contains').find('.badge').contains(0)
      })

      it('throws when there is both a subject and a filter', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find content: \'foo\' within the element: <div#edge-case-contains> and with the selector: \'ul\' but never did.')

          done()
        })

        cy.get('#edge-case-contains').contains('ul', 'foo')
      })

      it('throws after timing out while not trying to find an element that contains content', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected not to find content: \'button\' but continuously found it.')

          done()
        })

        cy.contains('button').should('not.exist')
      })

      it('logs out $el when existing $el is found even on failure', function (done) {
        const button = cy.$$('#button')

        cy.on('fail', (err) => {
          expect(this.lastLog.get('state')).to.eq('failed')
          expect(this.lastLog.get('error')).to.eq(err)
          expect(this.lastLog.get('$el').get(0)).to.eq(button.get(0))
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.Yielded).to.eq(button.get(0))
          expect(consoleProps.Elements).to.eq(button.length)

          done()
        })

        cy.contains('button').should('not.exist')
      })

      it('throws when assertion is have.length > 1', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(1)
          expect(err.message).to.eq('`cy.contains()` cannot be passed a `length` option because it will only ever return 1 element.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/contains')

          done()
        })

        cy.contains('Nested Find').should('have.length', 2)
      })

      it('restores contains even when cy.get fails', (done) => {
        const { contains } = Cypress.$Cypress.$.expr[':']

        const cyNow = cy.now

        cy.on('fail', (err) => {
          expect(err.message).to.include('Syntax error, unrecognized expression')
          expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)

          done()
        })

        cy.stub(cy, 'now').callsFake(() => cyNow('get', 'aBad:jQuery^Selector', {}))

        cy.contains(/^asdf \d+/)
      })

      it('restores contains on abort', (done) => {
        cy.timeout(1000)

        const { contains } = Cypress.$Cypress.$.expr[':']

        cy.stub(Cypress.runner, 'stop')

        cy.on('stop', () => {
          _.delay(() => {
            expect(Cypress.$Cypress.$.expr[':'].contains).to.eq(contains)

            done()
          }
          , 50)
        })

        cy.on('command:retry', _.after(2, () => {
          Cypress.stop()
        }))

        cy.contains(/^does not contain asdfasdf at all$/)
      })
    })
  })
})
