const { assertLogLength } = require('../../../support/utils')

const { _, $, Promise } = Cypress

describe('src/cy/commands/get', { defaultCommandTimeout: 200 }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
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
    beforeEach(function () {
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
      cy.get('#does-not-exist').should('not.exist').then(function () {
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

      cy.get('@get.users').then(function () {
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

  describe('errors', {
    defaultCommandTimeout: 50,
  }, () => {
    beforeEach(function () {
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
        assertLogLength(this.logs, 1)

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
