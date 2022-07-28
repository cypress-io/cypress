const { assertLogLength } = require('../../../support/utils')

const { _, $ } = Cypress

/*
 * This file is a partial copy of selector.cy.ts, exercising the functionality of cy.get()
 * using selector commands (__internalSelectorGet and __internalSelectorShould). It should
 * eventually be removed at the same time as those commands are merged into cy.get() / cy.should().
 */
describe('src/cy/commands/querying-selector', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#__internalSelectorGet', {
    defaultCommandTimeout: 2000,
  }, () => {
    it('finds by selector', () => {
      const list = cy.$$('#list')

      cy.__internalSelectorGet('#list').then(($list) => {
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

      cy.__internalSelectorGet('#missing-el').then(($div) => {
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

      cy.__internalSelectorGet('#missing-el', { timeout: 10000 })
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
      // to 200 after successfully finishing '__internalSelectorGet' method
      .then(() => {
        expect(cy.timeout()).to.eq(defaultCommandTimeout)
      })
    })

    it('cancels existing promises', (done) => {
      cy.stub(Cypress.runner, 'stop')

      let retries = 0

      const stop = _.after(2, () => {
        Cypress.stop()
      })

      cy.on('stop', () => {
        _.delay(() => {
          expect(retries).to.eq(2)
          done()
        }
        , 100)
      })

      cy.on('command:retry', () => {
        retries += 1
        stop()
      })

      cy.get('doesNotExist')
    })

    describe('custom elements', () => {
      // <foobarbazquux>custom element</foobarbazquux>

      it('can get a custom element', () => {
        cy.__internalSelectorGet('foobarbazquux').__internalSelectorShould('contain', 'custom element')
      })
    })

    describe('should(\'exist\')', {
      defaultCommandTimeout: 1000,
    }, () => {
      it('waits until button exists', () => {
        cy.on('command:retry', _.after(3, () => {
          cy.$$('body').append($('<div id=\'missing-el\'>missing el</div>'))
        }))

        cy.__internalSelectorGet('#missing-el').__internalSelectorShould('exist')
      })
    })

    describe('should(\'not.exist\')', () => {
      it('waits until button does not exist', () => {
        cy.timeout(500, true)

        cy.on('command:retry', _.after(2, () => {
          cy.$$('#button').remove()
        }))

        cy.__internalSelectorGet('#button').__internalSelectorShould('not.exist')
      })

      it('returns null when cannot find element', () => {
        cy.__internalSelectorGet('#missing-el').__internalSelectorShould('not.exist').then(($el) => {
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

        cy.__internalSelectorGet('#list li:last').__internalSelectorShould('not.exist').then(($el) => {
          expect($el).to.be.null
        })
      })
    })

    describe('visibility is unopinionated', () => {
      it('finds invisible elements by default', () => {
        const button = cy.$$('#button').hide()

        cy.__internalSelectorGet('#button').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'not.be.visible\')', () => {
      it('returns invisible element', () => {
        const button = cy.$$('#button').hide()

        // cy.__internalSelectorGet("#button").then ($button) ->
        // expect($button).not.to.be.visible

        cy.__internalSelectorGet('#button').__internalSelectorShould('not.be.visible').then(($button) => {
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

        cy.__internalSelectorGet('#button').__internalSelectorShould('not.be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'be.visible\')', () => {
      it('returns visible element', () => {
        const button = cy.$$('#button')

        cy.__internalSelectorGet('#button').__internalSelectorShould('be.visible').then(($button) => {
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

        cy.__internalSelectorGet('#button').__internalSelectorShould('be.visible').then(($button) => {
          expect($button.get(0)).to.eq(button.get(0))
        })
      })
    })

    describe('should(\'have.length\', n)', () => {
      it('resolves once length equals n', () => {
        const forms = cy.$$('form')

        cy.__internalSelectorGet('form').__internalSelectorShould('have.length', forms.length).then(($forms) => {
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
        cy.__internalSelectorGet('button').__internalSelectorShould('have.length', length).then(($buttons) => {
          expect($buttons.length).to.eq(length)
        })
      })
    })

    describe('assertion verification', () => {
      it('automatically retries', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$('button:first').attr('data-foo', 'bar')
        }))

        cy.__internalSelectorGet('button:first').__internalSelectorShould('have.attr', 'data-foo').__internalSelectorAnd('match', /bar/)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === '__internalSelectorGet') {
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
        cy.__internalSelectorGet('button').__internalSelectorShould('have.length', length).then(function ($buttons) {
          expect(this.lastLog.get('numElements')).to.eq(length)
        })
      })

      it('logs exist: false', () => {
        cy.__internalSelectorGet('#does-not-exist').__internalSelectorShould('not.exist').then(function () {
          expect(this.lastLog.get('message')).to.eq('#does-not-exist')

          expect(this.lastLog.get('$el').get(0)).not.to.be.ok
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === '__internalSelectorGet') {
            expect(log.pick('state', 'referencesAlias', 'aliasType')).to.deep.eq({
              state: 'pending',
              referencesAlias: undefined,
              aliasType: 'dom',
            })

            done()
          }
        })

        cy.__internalSelectorGet('body')
      })

      it('#consoleProps', () => {
        cy.__internalSelectorGet('body').then(function ($body) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: '__internalSelectorGet',
            Selector: 'body',
            Yielded: $body.get(0),
            Elements: 1,
          })
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === '__internalSelectorGet' || attrs.name === 'should') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws once when incorrect sizzle selector', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        cy.__internalSelectorGet('.spinner\'')
      })

      it('throws on too many elements after timing out waiting for length', (done) => {
        const buttons = cy.$$('button')

        cy.on('fail', (err) => {
          expect(err.message).to.include(`Too many elements found. Found '${buttons.length}', expected '${buttons.length - 1}'.`)

          done()
        })

        cy.__internalSelectorGet('button').__internalSelectorShould('have.length', buttons.length - 1)
      })

      it('throws on too few elements after timing out waiting for length', (done) => {
        const buttons = cy.$$('button')

        cy.on('fail', (err) => {
          expect(err.message).to.include(`Not enough elements found. Found '${buttons.length}', expected '${buttons.length + 1}'.`)

          done()
        })

        cy.__internalSelectorGet('button').__internalSelectorShould('have.length', buttons.length + 1)
      })

      it('throws after timing out not finding element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.__internalSelectorGet('#missing-el')
      })

      it('throws after timing out not finding element when should exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.__internalSelectorGet('#missing-el').__internalSelectorShould('exist')
      })

      it('throws existence error without running assertions', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.__internalSelectorGet('#missing-el').__internalSelectorShould('have.prop', 'foo')
      })

      it('throws after timing out while not trying to find an element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('Expected <div#dom> not to exist in the DOM, but it was continuously found.')

          done()
        })

        cy.__internalSelectorGet('div:first').__internalSelectorShould('not.exist')
      })

      it('throws after timing out while trying to find an invisible element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('expected \'<div#dom>\' not to be \'visible\'')

          done()
        })

        cy.__internalSelectorGet('div:first').__internalSelectorShould('not.be.visible')
      })

      it('does not include message about why element was not visible', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).not.to.include('why this element is not visible')

          done()
        })

        cy.__internalSelectorGet('div:first').__internalSelectorShould('not.be.visible')
      })

      it('throws after timing out trying to find a visible element', (done) => {
        cy.$$('#button').hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('This element `<button#button>` is not visible because it has CSS property: `display: none`')

          done()
        })

        cy.__internalSelectorGet('#button').__internalSelectorShould('be.visible')
      })

      it('includes a message about why the element was not visible', (done) => {
        cy.$$('#button').hide()

        cy.on('fail', (err) => {
          expect(err.message).to.include('element `<button#button>` is not visible because')

          done()
        })

        cy.__internalSelectorGet('#button').__internalSelectorShould('be.visible')
      })

      it('sets error command state', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.__internalSelectorGet('foobar')
      })

      _.each(['', 'foo', [], 1, null], (value) => {
        it(`throws when options property is not an object. Such as: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include(`only accepts an options object for its second argument. You passed ${value}`)

            done()
          })

          cy.__internalSelectorGet('foobar', value)
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

        cy.__internalSelectorGet('#button').__internalSelectorShould('be.visible')
      })
    })
  })
})
