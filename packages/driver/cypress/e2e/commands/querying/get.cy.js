const { assertLogLength } = require('../../../support/utils')

const { _, $, Promise } = Cypress

describe('src/cy/commands/querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#get', {
    defaultCommandTimeout: 200,
  }, () => {
    it('finds by selector', () => {
      const list = cy.$$('#list')

      cy.get('#list').then(($list) => {
        expect($list.get(0)).to.eq(list.get(0))
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

    it('respects null withinSubject', () => {
      cy.get('#list').within(() => {
        cy.get('#upper', { withinSubject: null })
      })
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

    context('shadow dom', () => {
      beforeEach(() => {
        cy.visit('/fixtures/shadow-dom.html')
      })

      it('finds elements within shadow roots', () => {
        cy.get('.shadow-1', { includeShadowDom: true })
        .should('have.text', 'Shadow Content 1')
      })

      it('finds shadow elements within shadow roots', () => {
        cy.get('.shadow-5', { includeShadowDom: true })
        .should('have.text', 'Shadow Content 5')
      })

      it('finds light elements within shadow slots', () => {
        cy.get('.in-shadow-slot', { includeShadowDom: true })
        .should('have.text', 'In Shadow Slot')
      })

      // TODO: enable once we support cross-boundary selectors nicely
      it.skip('finds elements within shadow roots with cross-boundary selector', () => {
        cy.get('#parent-of-shadow-container-0 .shadow-3', { includeShadowDom: true })
        .should('have.text', 'Shadow Content 3')
      })

      it('finds elements outside shadow roots', () => {
        cy.get('#non-shadow-element', { includeShadowDom: true })
        .should('have.text', 'Non Shadow')
      })

      it('finds elements in and out of shadow roots', () => {
        cy.get('.in-and-out', { includeShadowDom: true })
        .should('have.length', 2)
      })

      // https://github.com/cypress-io/cypress/issues/7676
      it('does not error when querySelectorAll is wrapped and snapshots are off', () => {
        cy.visit('/fixtures/shadow-dom.html?wrap-qsa=true')
        cy.get('.shadow-1', { includeShadowDom: true })
      })

      describe('non-command options', () => {
        describe('suite-level config', { includeShadowDom: true }, () => {
          beforeEach(() => {
            cy.get('.shadow-div')
          })

          it('queries shadow dom', () => {
            cy.get('.shadow-div')
          })

          it('also queries shadow dom', () => {
            cy.get('.shadow-div')
          })
        })

        describe('test-level config', () => {
          it('queries shadow dom', { includeShadowDom: true }, () => {
            cy.get('.shadow-div')
          })

          it('does not find element without option set', () => {
            cy.get('.shadow-div').should('not.exist')
          })
        })

        describe('Cypress.config()', () => {
          const reset = () => {
            Cypress.config('includeShadowDom', false)
          }

          beforeEach(reset)
          afterEach(reset)

          it('turns option on and off at will', () => {
            cy.get('.shadow-div').should('not.exist').then(() => {
              Cypress.config('includeShadowDom', true)
            })

            cy.get('.shadow-div')
          })

          it('overrides test-level option being true', { includeShadowDom: true }, () => {
            Cypress.config('includeShadowDom', false)

            cy.get('.shadow-div').should('not.exist')
          })

          it('overrides test-level option being false', { includeShadowDom: false }, () => {
            Cypress.config('includeShadowDom', true)

            cy.get('.shadow-div')
          })
        })
      })
    })

    describe('should(\'exist\')', {
      defaultCommandTimeout: 1000,
    }, () => {
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

      it('retries an alias when too many elements found', () => {
        // add 500ms to the delta
        cy.timeout(500, true)

        let buttons = cy.$$('button')

        const length = buttons.length - 2

        cy.on('command:retry', () => {
          buttons.last().remove()
          buttons = cy.$$('button')
        })

        // should eventually resolve after adding 1 button
        cy
        .get('button').as('btns')
        .get('@btns').should('have.length', length).then(($buttons) => {
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
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            this.lastLog = log

            this.logs?.push(log)
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
        cy.get('#does-not-exist').should('not.exist').then(function () {
          expect(this.lastLog.get('message')).to.eq('#does-not-exist')

          expect(this.lastLog.get('$el').get(0)).not.to.be.ok
        })
      })

      it('logs intercept aliases', () => {
        cy.visit('http://localhost:3500/fixtures/jquery.html')
        cy.intercept(/users/, {}).as('get.users')
        cy.window().then({ timeout: 2000 }, (win) => {
          win.$.get('/users')
        })

        cy.get('@get.users').then(function () {
          expect(this.lastLog.pick('message', 'referencesAlias', 'aliasType')).to.deep.eq({
            message: '@get.users',
            referencesAlias: { name: 'get.users' },
            aliasType: 'intercept',
          })
        })
      })

      it('logs primitive aliases', () => {
        cy.noop('foo').as('f')
        .get('@f').then(function () {
          expect(this.lastLog.pick('$el', 'numRetries', 'referencesAlias', 'aliasType')).to.deep.eq({
            referencesAlias: { name: 'f' },
            aliasType: 'primitive',
          })
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'get') {
            expect(log.pick('state', 'referencesAlias')).to.deep.eq({
              state: 'pending',
              referencesAlias: undefined,
            })

            done()
          }
        })

        cy.get('body')
      })

      it('snapshots and ends when consuming an alias', () => {
        cy
        .get('body').as('b')
        .get('@b').then(function () {
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
            alias: '@b',
            aliasType: 'dom',
            referencesAlias: undefined,
          }

          expect(this.lastLog.get('$el')).to.eql($body)

          _.each(obj, (value, key) => {
            expect(this.lastLog.get(key)).to.eq(value, `expected key: ${key} to eq value: ${value}`)
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

      it('#consoleProps with an intercept alias', () => {
        cy
        .intercept(/users/, {}).as('getUsers')
        .visit('http://localhost:3500/fixtures/jquery.html')
        .window().then({ timeout: 2000 }, (win) => {
          return win.$.get('/users')
        }).wait('@getUsers').get('@getUsers').then(function (obj) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'get',
            Alias: '@getUsers',
            Yielded: obj,
          })
        })
      })
    })

    describe('alias references', {
      defaultCommandTimeout: 100,
    }, () => {
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

      describe('intercept aliases', () => {
        it('returns the xhr', () => {
          cy
          .intercept(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .window().then({ timeout: 2000 }, (win) => {
            return win.$.get('/users')
          }).wait('@getUsers').get('@getUsers').then((xhr) => {
            expect(xhr.response.url).to.include('/users')
          })
        })

        it('handles dots in alias name', () => {
          cy.intercept(/users/, {}).as('get.users')
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.window().then({ timeout: 2000 }, (win) => {
            return win.$.get('/users')
          })

          cy.wait('@get.users').get('@get.users').then((xhr) => {
            expect(xhr.response.url).to.include('/users')
          })
        })

        it('returns null if no xhr is found', () => {
          cy
          .intercept(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .get('@getUsers').then((xhr) => {
            expect(xhr).to.be.null
          })
        })

        it('returns an array of xhrs', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .intercept(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).wait('@getUsers').wait('@getUsers').get('@getUsers.all').then((xhrs) => {
            expect(xhrs).to.be.an('array')
            expect(xhrs[0].response.url).to.include('/users?num=1')

            expect(xhrs[1].response.url).to.include('/users?num=2')
          })
        })

        it('returns an array of xhrs when dots in alias name', () => {
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.intercept(/users/, {}).as('get.users')
          cy.window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          })

          cy.wait('@get.users').wait('@get.users').get('@get.users.all').then((xhrs) => {
            expect(xhrs).to.be.an('array')
            expect(xhrs[0].response.url).to.include('/users?num=1')

            expect(xhrs[1].response.url).to.include('/users?num=2')
          })
        })

        it('returns the 1st xhr', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .intercept(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).wait('@getUsers').wait('@getUsers').get('@getUsers.1').then((xhr1) => {
            expect(xhr1.response.url).to.include('/users?num=1')
          })
        })

        it('returns the 2nd xhr', () => {
          cy
          .visit('http://localhost:3500/fixtures/jquery.html')
          .intercept(/users/, {}).as('getUsers')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).wait('@getUsers').wait('@getUsers').get('@getUsers.2').then((xhr2) => {
            expect(xhr2.response.url).to.include('/users?num=2')
          })
        })

        it('returns the 2nd xhr when dots in alias', () => {
          cy.visit('http://localhost:3500/fixtures/jquery.html')
          cy.intercept(/users/, {}).as('get.users')
          cy.window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          })

          cy.wait('@get.users').wait('@get.users').get('@get.users.2').then((xhr2) => {
            expect(xhr2.response.url).to.include('/users?num=2')
          })
        })

        it('returns the 3rd xhr as null', () => {
          cy
          .intercept(/users/, {}).as('getUsers')
          .visit('http://localhost:3500/fixtures/jquery.html')
          .window().then({ timeout: 2000 }, (win) => {
            return Promise.all([
              win.$.get('/users', { num: 1 }),
              win.$.get('/users', { num: 2 }),
            ])
          }).wait('@getUsers').wait('@getUsers').get('@getUsers.3').then((xhr3) => {
            expect(xhr3).to.be.null
          })
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        const collectLogs = (attrs, log) => {
          this.lastLog = log

          this.logs?.push(log)
        }

        cy.on('log:added', collectLogs)
        cy.on('fail', () => {
          cy.off('log:added', collectLogs)
        })

        return null
      })

      it('throws once when incorrect sizzle selector', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        cy.get('.spinner\'')
      })

      it('throws on too many elements after timing out waiting for length', (done) => {
        const buttons = cy.$$('button')

        cy.on('fail', (err) => {
          expect(err.name).to.eq('AssertionError')
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
          expect(err.name).to.include('AssertionError')
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el')
      })

      it('throws after timing out not finding element when should exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.include('AssertionError')
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el').should('exist')
      })

      it('throws existence error without running assertions', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.include('AssertionError')
          expect(err.message).to.include('Expected to find element: `#missing-el`, but never found it.')

          done()
        })

        cy.get('#missing-el').should('have.prop', 'foo')
      })

      it('throws when using an alias that does not exist', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.include('CypressError')
          expect(err.message).to.include('could not find a registered alias for: `@alias`.\nYou have not aliased anything yet.')

          done()
        })

        cy.get('@alias')
      })

      it('throws after timing out after a .wait() alias reference', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.eq('AssertionError')
          expect(err.message).to.include('Expected to find element: `getJsonButton`, but never found it.')

          done()
        })

        cy
        .intercept(/json/, { foo: 'foo' }).as('getJSON')
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
          expect(err.name).to.eq('AssertionError')
          expect(err.message).to.include('Expected <div#dom> not to exist in the DOM, but it was continuously found.')

          done()
        })

        cy.get('div:first').should('not.exist')
      })

      it('throws after timing out while trying to find an invisible element', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.eq('AssertionError')
          expect(err.message).to.include('expected \'<div#dom>\' not to be \'visible\'')

          done()
        })

        cy.get('div:first').should('not.be.visible')
      })

      it('fails get command when element is not found', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.name).to.eq('AssertionError')
          expect(err.message).to.eq('Timed out retrying after 1ms: Expected to find element: `does_not_exist`, but never found it.')

          expect(lastLog.get('name')).to.eq('get')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.get('does_not_exist', { timeout: 1 })
      })

      it('fails get command when element is not found and has chained assertions', function (done) {
        cy.once('fail', (err) => {
          const { logs, lastLog } = this
          const getLog = logs[logs.length - 2]

          expect(err.name).to.eq('AssertionError')
          expect(err.message).to.eq('Timed out retrying after 1ms: Expected to find element: `does_not_exist`, but never found it.')

          expect(getLog.get('name')).to.eq('get')
          expect(getLog.get('state')).to.eq('failed')
          expect(getLog.get('error')).to.eq(err)

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.get('does_not_exist', { timeout: 1 }).should('have.class', 'hi')
      })

      it('does not include message about why element was not visible', (done) => {
        cy.on('fail', (err) => {
          expect(err.name).to.eq('AssertionError')
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
        .intercept(/users/, {}).as('getUsers')
        .get('@getUsers.0')
      })

      it('throws when alias property isnt just a digit', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('could not find a registered alias for: `@getUsers.1b`')

          done()
        })

        cy
        .intercept(/users/, {}).as('getUsers')
        .get('@getUsers.1b')
      })

      it('throws when alias property isnt a digit or `all`', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('could not find a registered alias for: `@getUsers.all `')

          done()
        })

        cy
        .intercept(/users/, {}).as('getUsers')
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
          assertLogLength(this.logs, 2)

          const getLog = this.logs[0]
          const assertionLog = this.logs[1]

          expect(err.message).to.contain('This element `<button#button>` is not visible because it has CSS property: `display: none`')

          expect(getLog.get('state')).to.eq('passed')
          expect(getLog.get('error')).to.be.undefined
          expect(getLog.get('$el').get(0)).to.eq(button.get(0))
          const consoleProps = getLog.invoke('consoleProps')

          expect(consoleProps.Yielded).to.eq(button.get(0))
          expect(consoleProps.Elements).to.eq(button.length)

          expect(assertionLog.get('state')).to.eq('failed')
          expect(err.message).to.include(assertionLog.get('error').message)

          done()
        })

        cy.get('#button').should('be.visible')
      })
    })
  })
})
