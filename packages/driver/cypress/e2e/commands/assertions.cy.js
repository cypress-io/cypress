const { assertLogLength } = require('../../support/utils')
const { $, _ } = Cypress

const captureCommands = () => {
  const commands = []

  let current

  cy.on('command:start', (command) => {
    current = command
    commands.push({
      name: command.attributes.name,
      snapshots: 0,
      retries: 0,
    })
  })

  cy.on('command:retry', () => {
    commands[commands.length - 1].retries++
  })

  cy.on('snapshot', () => {
    // Snapshots can occur outside the context of a command - for example, `expect(foo).to.exist` without any wrapping cy command.
    // So we keep track of the current command when one starts, and if we're not inside that, create an 'empty' command
    // for the snapshot to belong to
    if (!commands.length || current !== cy.state('current')) {
      current = null
      commands.push({ name: null, snapshots: 0, retries: 0 })
    }

    commands[commands.length - 1].snapshots++
  })

  return () => _.cloneDeep(commands)
}

describe('src/cy/commands/assertions', () => {
  let testCommands

  beforeEach(function () {
    cy.visit('/fixtures/jquery.html')

    testCommands = captureCommands()
  })

  context('#should', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
        this.lastLog = log
      })

      return null
    })

    it('returns the subject for chainability', () => {
      cy.noop({ foo: 'bar' })
      .should('deep.eq', { foo: 'bar' })
      .then((obj) => {
        expect(testCommands()).to.eql([
          { name: 'visit', snapshots: 1, retries: 0 },
          { name: 'noop', snapshots: 0, retries: 0 },
          { name: 'should', snapshots: 1, retries: 0 },
          { name: 'then', snapshots: 0, retries: 0 },
        ])
      })
    })

    it('can use negation', () => {
      cy.noop(false).should('not.be.true')
    })

    it('works with jquery chai', () => {
      const div = $('<div class=\'foo\'>asdf</div>')

      cy.$$('body').append(div)

      cy
      .get('div.foo').should('have.class', 'foo').then(($div) => {
        expect($div).to.match(div)

        $div.remove()
      })
    })

    it('can chain multiple assertions', () => {
      cy
      .get('body')
      .should('contain', 'div')
      .should('have.property', 'length', 1)
    })

    it('skips over utility commands', () => {
      cy.on('command:retry', _.after(2, () => {
        cy.$$('div:first').addClass('foo')
      }))

      cy.on('command:retry', _.after(4, () => {
        cy.$$('div:first').attr('id', 'bar')
      }))

      cy.get('div:first').should('have.class', 'foo').debug().and('have.id', 'bar')
    })

    it('skips over aliasing', () => {
      cy.on('command:retry', _.after(2, () => {
        cy.$$('div:first').addClass('foo')
      }))

      cy.on('command:retry', _.after(4, () => {
        cy.$$('div:first').attr('id', 'bar')
      }))

      cy.get('div:first').as('div').should('have.class', 'foo').debug().and('have.id', 'bar')
    })

    it('can change the subject', () => {
      cy.get('input:first').should('have.property', 'length').should('eq', 1).then((num) => {
        expect(num).to.eq(1)
      })
    })

    it('changes the subject with chai-jquery', () => {
      cy.$$('input:first').attr('id', 'input')

      cy.get('input:first').should('have.attr', 'id').should('eq', 'input')
    })

    it('changes the subject with JSON', () => {
      const obj = { requestJSON: { teamIds: [2] } }

      cy.noop(obj).its('requestJSON').should('have.property', 'teamIds').should('deep.eq', [2])
    })

    it('does it retry when wrapped', () => {
      const obj = { foo: 'bar' }

      cy.wrap(obj).then(() => {
        setTimeout(() => {
          obj.foo = 'baz'
        }, 100)

        cy.wrap(obj)
      })
      .should('deep.eq', { foo: 'baz' })
      .then(() => {
        expect(testCommands()).to.containSubset([
          { name: 'wrap', snapshots: 1, retries: 0 },
          { name: 'then', snapshots: 0, retries: 0 },
          { name: 'wrap', snapshots: 2, retries: (r) => r > 1 },
          { name: 'then', snapshots: 0, retries: 0 },
        ])
      })
    })

    // https://github.com/cypress-io/cypress/issues/16006
    it(`shows all .should('contain') assertions when chained after .should('be.visible')`, function () {
      cy.get('#data-number')
      .should('be.visible')
      .should('contain', 'span')
      .should('contain', 'with')
      .then(function () {
        expect(this.logs[2].get('message')).to.contain('**span**')
        expect(this.logs[3].get('message')).to.contain('**with**')
      })
    })

    /*
     * There was a bug (initially discovered as part of https://github.com/cypress-io/cypress/issues/23699 but not
     * directly related) in our copy of chai where, when an element with a trailing space was asserted on,
     * the log message would oscillate rapidly between two states. This happened because we were re-using a global
     * regular expression - which tracks internal state.
     *
     * https://stackoverflow.com/questions/15276873/is-javascript-test-saving-state-in-the-regex
     */
    it('should be consistent with log message across retries', (done) => {
      let assertionMessage

      cy.on('command:retry', () => {
        if (assertionMessage) {
          expect(assertionMessage).to.equal(cy.state('current').get('logs')[1].get('message'))
          done()
        }

        assertionMessage = cy.state('current').get('logs')[1].get('message')
      })

      cy.get('#with-trailing-space').should('have.text', 'I\'ve got a lovely bunch of coconuts')
    })

    describe('function argument', () => {
      it('waits until function is true', () => {
        const button = cy.$$('button:first')

        cy.on('command:retry', _.after(2, () => {
          button.addClass('ready')
        }))

        cy.get('button:first').should(($button) => {
          expect($button).to.have.class('ready')
        })
        .then(() => {
          expect(testCommands()).to.eql([
            { name: 'visit', snapshots: 1, retries: 0 },
            // cy.get() has 2 snapshots, 1 for itself, and 1
            // for the .should(...) assertion.

            // TODO: Investigate whether or not the 2 commands are
            // snapshotted at the same time. If there's no tick between
            // them, we could reuse the snapshots
            { name: 'get', snapshots: 2, retries: 2 },
            { name: 'then', snapshots: 0, retries: 0 },
          ])
        })
      })

      it('works with regular objects', () => {
        const obj = {}

        cy.on('command:retry', _.after(2, () => {
          obj.foo = 'bar'
        }))

        cy.wrap(obj).should((o) => {
          expect(o).to.have.property('foo').and.eq('bar')
        }).then(function () {
          // wrap + have property + and eq
          assertLogLength(this.logs, 3)
        })
      })

      it('logs two assertions', () => {
        _.delay(() => {
          cy.$$('body').addClass('foo')
        }
        , Math.random() * 300)

        _.delay(() => {
          cy.$$('body').prop('id', 'bar')
        }
        , Math.random() * 300)

        cy
        .get('body').should(($body) => {
          expect($body).to.have.class('foo')

          expect($body).to.have.id('bar')
        }).then(function () {
          cy.$$('body').removeClass('foo').removeAttr('id')

          assertLogLength(this.logs, 3)

          // the messages should have been updated to reflect
          // the current state of the <body> element
          expect(this.logs[1].get('message')).to.eq('expected **<body#bar.foo>** to have class **foo**')

          expect(this.logs[2].get('message')).to.eq('expected **<body#bar.foo>** to have id **bar**')
        })
      })

      it('logs assertions as children even if subject is different', () => {
        _.delay(() => {
          cy.$$('body').addClass('foo')
        }
        , Math.random() * 300)

        _.delay(() => {
          cy.$$('body').prop('id', 'bar')
        }
        , Math.random() * 300)

        cy
        .get('body').should(($body) => {
          expect($body.attr('class')).to.match(/foo/)

          expect($body.attr('id')).to.include('bar')
        }).then(function () {
          cy.$$('body').removeClass('foo').removeAttr('id')

          const types = _.map(this.logs, (l) => l.get('type'))

          expect(types).to.deep.eq(['parent', 'child', 'child'])

          assertLogLength(this.logs, 4)
        })
      })

      it('can be chained', () => {
        cy.wrap('ab')
        .should((subject) => {
          expect(subject).to.be.a('string')
          expect(subject).to.contain('a')
        })
        .should((subject) => {
          expect(subject).to.contain('b')
          expect(subject).to.have.length(2)
        })
        .and((subject) => {
          expect(subject).to.eq('ab')
          expect(subject).not.to.contain('c')
        })
        .then(function () {
          assertLogLength(this.logs, 8)

          this.logs.slice(1).forEach((log) => {
            expect(log.get('name')).to.eq('assert')
          })
        })
      })

      // https://github.com/cypress-io/cypress/issues/22587
      it('does not allow cypress commands inside the callback', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.should()` failed because you invoked a command inside the callback. `cy.should()` retries the inner function, which would result in commands being added to the queue multiple times. Use `cy.then()` instead of `cy.should()`, or move any commands outside the callback function.\n\nThe command invoked was:\n\n  > `cy.log()`')

          done()
        })

        cy.window().should((win) => {
          cy.log(win)
        })
      })

      context('remote jQuery instances', () => {
        beforeEach(function () {
          this.remoteWindow = cy.state('window')
        })

        it('yields the remote jQuery instance', function () {
          let fn

          this.remoteWindow.$.fn.__foobar = (fn = function () {})

          cy
          .get('input:first').should(function ($input) {
            const isInstanceOf = Cypress.utils.isInstanceOf($input, this.remoteWindow.$)
            const hasProp = $input.__foobar === fn

            expect(isInstanceOf).to.be.true

            expect(hasProp).to.to.true
          })
        })
      })
    })

    describe('not.exist', () => {
      it('resolves eventually not exist', () => {
        const button = cy.$$('button:first')

        cy.on('command:retry', _.after(3, _.once(() => {
          button.remove()
        })))

        cy.get('button:first').click().should('not.exist')

        cy.then(function () {
          assertLogLength(this.logs, 3)
        })
      })

      it('resolves all 3 assertions', (done) => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            logs?.push(log)

            if (logs.length === 3) {
              done()
            }
          }
        })

        cy
        .get('#does-not-exist1').should('not.exist')
        .get('#does-not-exist2').should('not.exist')
        .get('#does-not-exist3').should('not.exist')
      })
    })

    describe('have.text', () => {
      it('resolves the assertion', () => {
        cy.get('#list li').eq(0).should('have.text', 'li 0').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('have.length', () => {
      it('allows valid string numbers', () => {
        const { length } = cy.$$('button')

        cy.get('button').should('have.length', `${length}`)
      })

      it('throws when should(\'have.length\') isnt a number', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('You must provide a valid number to a `length` assertion. You passed: `asdf`')

          done()
        })

        cy.get('button').should('have.length', 'asdf')
      })

      it('does not log extra commands on fail and properly fails command + assertions', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 6)
          expect(err.message).to.eq('You must provide a valid number to a `length` assertion. You passed: `asdf`')

          expect(this.logs[3].get('name')).to.eq('get')
          expect(this.logs[3].get('state')).to.eq('passed')
          expect(this.logs[3].get('error')).to.be.undefined

          expect(this.logs[4].get('name')).to.eq('assert')
          expect(this.logs[4].get('state')).to.eq('failed')
          expect(this.logs[4].get('error').name).to.eq('CypressError')
          expect(this.logs[4].get('error')).to.eq(err)

          done()
        })

        cy
        .root()
        .should('exist')
        .and('contain', 'foo')
        .get('button')
        .should('have.length', 'asdf')
      })

      it('finishes failed assertions and does not log extra commands when cy.contains fails', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 2)

          expect(this.logs[0].get('name')).to.eq('contains')
          expect(this.logs[0].get('state')).to.eq('passed')
          expect(this.logs[0].get('error')).to.be.undefined

          expect(this.logs[1].get('name')).to.eq('assert')
          expect(this.logs[1].get('state')).to.eq('failed')
          expect(this.logs[1].get('error').name).to.eq('AssertionError')
          expect(this.logs[1].get('error')).to.eq(err)

          done()
        })

        cy.contains('Nested Find', { timeout: 50 }).should('have.length', 2)
      })

      // https://github.com/cypress-io/cypress/issues/6384
      it('can chain contains assertions off of cy.contains', () => {
        cy.timeout(100)
        cy.contains('foo')
        .should('not.contain', 'asdfasdf')

        cy.contains('foo')
        .should('contain', 'foo')

        cy.contains(/foo/)
        .should('not.contain', 'asdfsadf')

        cy.contains(/foo/)
        .should('contain', 'foo')

        // this isn't valid: .should('contain') does not support regex
        // cy.contains(/foo/)
        // .should('contain', /foo/)
      })
    })

    describe('have.class', () => {
      it('snapshots and ends the assertion after retrying', () => {
        cy.on('command:retry', _.after(3, () => {
          cy.$$('#foo').addClass('active')
        }))

        cy.contains('foo').should('have.class', 'active').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('retries assertion until true', () => {
        const button = cy.$$('button:first')

        const retry = _.after(3, () => {
          button.addClass('new-class')
        })

        cy.on('command:retry', retry)

        cy.get('button:first').should('have.class', 'new-class')
      })
    })

    // https://github.com/cypress-io/cypress/issues/9644
    describe('calledOnceWith', () => {
      it('be.calledOnceWith', () => {
        const spy = cy.spy().as('spy')

        setTimeout(() => {
          spy({ bar: 'test' }, 1234)
        }, 100)

        cy.get('@spy').should(
          'be.calledOnceWith',
          {
            bar: 'test',
          },
        )
      })

      it('be.calledOnceWithExactly', () => {
        const spy = cy.spy().as('spy')

        setTimeout(() => {
          spy({ bar: 'test' })
        }, 100)

        cy.get('@spy').should(
          'be.calledOnceWithExactly',
          { bar: 'test' },
        )

        const spy2 = cy.spy().as('spy2')

        setTimeout(() => {
          spy2({ bar: 'test' }, 12345)
        }, 100)

        cy.get('@spy2').should(
          'not.be.calledOnceWithExactly',
          { bar: 'test' },
        )
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      it('should not be true', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('expected false to be true')

          done()
        })

        cy.noop(false).should('be.true')
      })

      it('throws err when not available chainable', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('The chainer `dee` was not found. Could not build assertion.')

          done()
        })

        cy.noop({}).should('dee.eq', {})
      })

      // https://github.com/cypress-io/cypress/issues/7870
      it('handles when a string literal is thrown', () => {
        cy.on('fail', (err) => {
          expect(err.message).eq('error string')
        })

        cy.then(() => {
          throw 'error string'
        })
      })

      describe('language chainers err', () => {
        // https://github.com/cypress-io/cypress/issues/883
        const langChainers = ['to', 'be', 'been', 'is', 'that', 'which', 'and', 'has', 'have', 'with', 'at', 'of', 'same', 'but', 'does', 'still']

        langChainers.forEach((langChainer) => {
          it(`throws err when assertion contains only one language chainer: ${langChainer}`, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.eq(`The chainer \`${langChainer}\` is a language chainer provided to improve the readability of your assertions, not an actual assertion. Please provide a valid assertion.`)
              expect(err.docsUrl).to.eq('https://on.cypress.io/assertions')

              done()
            })

            cy.noop(true).should(langChainer, true)
          })
        })
      })

      it('throws err when ends with a non available chainable', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('The chainer `eq2` was not found. Could not build assertion.')

          done()
        })

        cy.noop({}).should('deep.eq2', {})
      })

      it('logs \'should\' when non available chainer', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 2)
          expect(lastLog.get('name')).to.eq('should')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('message')).to.eq('not.contain2, does-not-exist-foo-bar')

          done()
        })

        cy.get('div:first').should('not.contain2', 'does-not-exist-foo-bar')
      })

      it('throws when eventually times out', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('Timed out retrying after 50ms: expected \'<button>\' to have class \'does-not-have-class\'')

          done()
        })

        cy.get('button:first').should('have.class', 'does-not-have-class')
      })

      it('has a pending state while retrying queries', (done) => {
        cy.on('command:retry', (command) => {
          const [getLog, shouldLog] = cy.state('current').get('logs')

          expect(getLog.get('state')).to.eq('pending')
          expect(shouldLog.get('state')).to.eq('pending')

          done()
        })

        cy.get('button:first', { timeout: 500 }).should('have.class', 'does-not-have-class')
      })

      it('has a pending state while retrying for commands with onFail', function (done) {
        cy.on('command:retry', () => {
          // Wait for the readFile response to come back from the server
          if (this.logs.length < 2) {
            return
          }

          const [readFileLog, shouldLog] = this.logs

          expect(readFileLog.get('state')).to.eq('pending')
          expect(shouldLog.get('state')).to.eq('pending')

          done()
        })

        cy.readFile('does-not-exist.json', { timeout: 500 }).should('exist')
      })

      it('throws when the subject eventually isnt in the DOM', function (done) {
        cy.timeout(200)

        const button = cy.$$('button:first')

        cy.on('command:retry', _.after(2, _.once(() => {
          button.addClass('foo').remove()
        })))

        cy.on('fail', (err) => {
          const names = _.invokeMap(this.logs, 'get', 'name')

          // should is present here due to the retry
          expect(names).to.deep.eq(['get', 'click', 'assert'])
          expect(err.message).to.include('`cy.should()` failed because the page updated')

          done()
        })

        cy.get('button:first').click().should('have.class', 'foo')
      })

      it('throws when should(\'have.length\') isnt a number', function (done) {
        // we specifically turn off logging have.length validation errors
        // because the assertion will already be logged
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 3)
          expect(err.message).to.eq('You must provide a valid number to a `length` assertion. You passed: `foo`')
          expect(lastLog.get('name')).to.eq('should')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('message')).to.eq('have.length, foo')

          done()
        })

        cy.get('button').should('have.length', 'foo')
      })

      it('does not additionally log when .should is the current command', function (done) {
        cy.once('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('name')).to.eq('should')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('message')).to.eq('deep.eq2, {}')

          done()
        })

        cy.noop({}).should('deep.eq2', {})
      })

      it('logs and immediately fails on custom match assertions', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 2)
          expect(err.message).to.eq('`match` requires its argument be a `RegExp`. You passed: `foo`')
          expect(lastLog.get('name')).to.eq('should')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('message')).to.eq('match, foo')

          done()
        })

        cy.wrap('foo').should('match', 'foo')
      })

      it('does not log ensureElExistence errors', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          done()
        })

        cy.get('#does-not-exist')
      })

      it('throws if used as a parent command', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(err.message).to.include('looks like you are trying to call a child command before running a parent command')

          done()
        })

        cy.should(() => {})
      })
    })

    describe('.log', () => {
      it('is type child', () => {
        cy.get('button').should('match', 'button').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')

          expect(lastLog.get('type')).to.eq('child')
        })
      })

      it('is type child when alias between assertions', () => {
        cy.get('button').as('btn').should('match', 'button').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')

          expect(lastLog.get('type')).to.eq('child')
        })
      })
    })
  })

  context('#and', () => {
    it('proxies to #should', () => {
      cy.noop({ foo: 'bar' }).should('have.property', 'foo').and('eq', 'bar')
    })
  })

  context('#assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)

        if (attrs.name === 'assert') {
          this.lastLog = log
        }
      })

      return null
    })

    it('does not output should logs on failures', { defaultCommandTimeout: 50 }, function (done) {
      cy.on('fail', () => {
        const { length } = this.logs

        expect(length).to.eq(1)

        done()
      })

      cy.noop({}).should('have.property', 'foo')
    })

    it('snapshots immediately and sets child', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name !== 'assert') {
          return
        }

        cy.removeAllListeners('log:added')
        expect(log.get('snapshots').length).to.eq(1)
        expect(log.get('snapshots')[0]).to.be.an('object')
        expect(log.get('type')).to.eq('child')

        done()
      })

      cy.get('body').then((subject) => {
        expect(subject).to.match('body')
      })
    })

    it('sets type to child current command had arguments but does not match subject', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('child')

          done()
        }
      })

      cy.get('body').then(($body) => {
        expect($body.length).to.eq(1)
      })
    })

    it('sets type to parent when assertion did not involve current subject and didnt have arguments', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('type')).to.eq('parent')

          done()
        }
      })

      cy.get('body').then(() => {
        expect(true).to.be.true
      })
    })

    it('removes rest of line when passing assertion includes \', but\' for jQuery subjects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        expect($a).to.have.attr('href', '#')
      })
    })

    it('does not replaces instances of word \'but\' with \'and\' for failing assertion', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<a>** to have attribute **href** with the value **asdf**, but the value was **#**')

          done()
        }
      })

      cy.get('a:first').then(($a) => {
        try {
          expect($a).to.have.attr('href', 'asdf')
        } catch (error) {} // eslint-disable-line no-empty
      })
    })

    it('does not replace \'button\' with \'andton\'', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq('expected **<button>** to be **visible**')

          done()
        }
      })

      cy.get('button:first').then(($button) => {
        expect($button).to.be.visible
      })
    })

    // https://github.com/cypress-io/cypress/issues/16570
    it('handles BigInt correctly', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          expect(log.get('message')).to.eq('expected **2n** to equal **2n**')

          done()
        }
      })

      expect(2n).to.equal(2n)
    })

    it('handles non-HTMLElement(s) (e.g. Element)', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><foo><bar>Bar</bar></foo>'
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'application/xml')
      const foo = doc.getElementsByTagName('foo')[0]

      expect(foo).not.to.be.undefined
      expect(foo).to.be.instanceOf(Element)
      expect(foo).not.to.be.instanceOf(HTMLElement)
    })

    it('#consoleProps for regular objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              expected: 1,
              actual: 1,
              Message: 'expected 1 to equal 1',
            },
          })

          done()
        }
      })

      cy.then(() => {
        expect(1).to.eq(1)
      })
    })

    it('#consoleProps for DOM objects', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.invoke('consoleProps')).to.deep.eq({
            name: 'assert',
            type: 'command',
            props: {
              subject: log.get('subject'),
              Message: 'expected <body> to have property length',
            },
          })

          done()
        }
      })

      cy
      .get('body').then(($body) => {
        expect($body).to.have.property('length')
      })
    })

    it('#consoleProps for errors', (done) => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')
          let err

          try {
            expect(log.invoke('consoleProps')).to.deep.contain({
              name: 'assert',
              type: 'command',
              error: log.get('error').stack,
              props: {
                expected: false,
                actual: true,
                Message: 'expected true to be false',
              },
            })
          } catch (e) {
            err = e
          }

          done(err)
        }
      })

      cy.then(() => {
        try {
          expect(true).to.be.false
        } catch (err) {} // eslint-disable-line no-empty
      })
    })

    describe('#patchAssert', () => {
      it('wraps \#{this} and \#{exp} in \#{b}', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **foo** to equal **foo**')

            done()
          }
        })

        cy.then(() => {
          expect('foo').to.eq('foo')
        })
      })

      it('doesnt mutate error message', () => {
        cy.then(() => {
          try {
            expect(true).to.eq(false)
          } catch (e) {
            expect(e.message).to.eq('expected true to equal false')
          }
        })
      })

      describe('jQuery elements', () => {
        it('sets _obj to selector', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<body>** to exist in the DOM')

              done()
            }
          })

          cy.get('body').then(($body) => {
            expect($body).to.exist
          })
        })

        it('matches empty string attributes', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'assert') {
              cy.removeAllListeners('log:added')

              expect(log.get('message')).to.eq('expected **<input>** to have attribute **value** with the value **\'\'**')

              done()
            }
          })

          cy.$$('body').prepend($('<input value=\'\' />'))

          cy.get('input').eq(0).then(($input) => {
            expect($input).to.have.attr('value', '')
          })
        })

        it('can chain off of chai-jquery assertions', () => {
          const $el = cy.$$('ul#list')

          expect($el).to.be.visible.and.have.id('list')
        })

        describe('without selector', () => {
          it('exists', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<div>** to exist in the DOM')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend($('<div />'))

            // expect($div).to.match("div")
            cy.get('div').eq(0).then(($div) => {
              expect($div).to.exist
            })
          })

          it('uses element name', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<input>** to match **input**')

                done()
              }
            })

            // prepend an empty div so it has no id or class
            cy.$$('body').prepend($('<input />'))

            cy.get('input').eq(0).then(($div) => {
              expect($div).to.match('input')
            })
          })
        })

        describe('property assertions', () => {
          it('has property', (done) => {
            cy.on('log:added', (attrs, log) => {
              if (attrs.name === 'assert') {
                cy.removeAllListeners('log:added')

                expect(log.get('message')).to.eq('expected **<button>** to have property **length**')

                done()
              }
            })

            cy.get('button:first').should('have.property', 'length')
          })

          it('passes on expected subjects without changing them', () => {
            cy.state('window').$.fn.foo = 'bar'

            cy
            .get('input:first').then(($input) => {
              expect($input).to.have.property('foo', 'bar')
            })
          })
        })
      })
    })
  })

  context('chai assert', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    it('equal', function () {
      assert.equal(1, 1, 'one is one')

      expect(this.logs[0].get('message')).to.eq('one is one: expected **1** to equal **1**')
    })

    it('isOk', function () {
      assert.isOk({}, 'is okay')

      expect(this.logs[0].get('message')).to.eq('is okay: expected **{}** to be truthy')
    })

    it('isFalse', function () {
      assert.isFalse(false, 'is false')

      expect(this.logs[0].get('message')).to.eq('is false: expected **false** to be false')
    })
  })

  describe('message formatting', () => {
    const expectMarkdown = (test, message, done) => {
      cy.then(() => {
        test()
      })

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'assert') {
          cy.removeAllListeners('log:added')

          expect(log.get('message')).to.eq(message)

          done()
        }
      })
    }

    // https://github.com/cypress-io/cypress/issues/19116
    it('text with backslashes', (done) => {
      const text = '"<OE_D]dQ\\'

      expectMarkdown(
        () => expect(text).to.equal(text),
        `expected **"<OE_D]dQ\\\\** to equal **"<OE_D]dQ\\\\**`,
        done,
      )
    })

    describe('messages with quotation marks', () => {
      it('preserves quotation marks in number strings', (done) => {
        expectMarkdown(() => {
          try {
            expect(25).to.eq('25')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **25** to equal **'25'**`,
        done)
      })

      it('preserves quotation marks in empty string', (done) => {
        expectMarkdown(() => {
          try {
            expect(42).to.eq('')
          } catch (error) {} /* eslint-disable-line no-empty */
        },
        `expected **42** to equal **''**`,
        done)
      })

      it('preserves quotation marks if escaped', (done) => {
        expectMarkdown(
          () => expect(`\'cypress\'`).to.eq(`\'cypress\'`),
          // ****'cypress'**** -> ** for emphasizing result string  + ** for emphasizing the entire result.
          `expected **'cypress'** to equal ****'cypress'****`,
          done,
        )
      })

      it('removes quotation marks in DOM elements', (done) => {
        expectMarkdown(
          () => {
            cy.get('body').then(($body) => {
              expect($body).to.contain('div')
            })
          },
          `expected **<body>** to contain **div**`,
          done,
        )
      })

      it('removes quotation marks in strings', (done) => {
        expectMarkdown(() => expect('cypress').to.eq('cypress'), `expected **cypress** to equal **cypress**`, done)
      })

      it('removes quotation marks in objects', (done) => {
        expectMarkdown(
          () => expect({ foo: 'bar' }).to.deep.eq({ foo: 'bar' }),
          `expected **{ foo: bar }** to deeply equal **{ foo: bar }**`,
          done,
        )
      })

      it('formats keys properly for "have.all.keys"', (done) => {
        const person = {
          name: 'Joe',
          age: 20,
        }

        expectMarkdown(
          () => expect(person).to.have.all.keys('name', 'age'),
          `expected **{ name: Joe, age: 20 }** to have keys **name**, and **age**`,
          done,
        )
      })
    })

    describe('formats strings with spaces', (done) => {
      const tester = (message, done) => {
        const nbspedMsg = message
        .replace(/^\s+/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })
        .replace(/\s+$/, (match) => {
          return match.replace(/\s/g, '&nbsp;')
        })

        expectMarkdown(() => expect(message).to.eq(message), `expected **'${nbspedMsg}'** to equal **'${nbspedMsg}'**`, done)
      }

      [' 37:46 ', '   test      ', '  love'].forEach((v) => {
        it(v, (done) => {
          tester(v, done)
        })
      })
    })

    describe('escape markdown', () => {
      // https://github.com/cypress-io/cypress/issues/17357
      it('images', (done) => {
        const text = 'hello world ![JSDoc example](/slides/img/jsdoc.png)'
        const result = 'hello world ``![JSDoc example](/slides/img/jsdoc.png)``'

        expectMarkdown(
          () => expect(text).to.equal(text),
          `expected **${result}** to equal **${result}**`,
          done,
        )
      })
    })
  })

  context('chai overrides', () => {
    beforeEach(function () {
      this.$body = cy.$$('body')
    })

    describe('#contain', () => {
      it('can find input type submit by value', function () {
        // $input creates an HTML element to be tested.
        // eslint-disable-next-line no-unused-vars
        const $input = cy.$$('<input type=\'submit\' value=\'click me\' />').appendTo(this.$body)

        cy.get('input[type=submit]').should('contain', 'click me')
      })

      it('is true when element contains text', () => {
        cy.get('div').should('contain', 'Nested Find')
      })

      it('calls super when not DOM element', () => {
        cy.noop('foobar').should('contain', 'oob')
      })

      // https://github.com/cypress-io/cypress/issues/205
      it('fails existence check on not.contain for non-existent DOM', function (done) {
        cy.timeout(100)
        cy.on('fail', ({ message }) => {
          expect(message)
          .include('.non-existent')
          .include('but never found it')

          done()
        })

        cy.get('.non-existent').should('not.contain', 'foo')
      })

      // https://github.com/cypress-io/cypress/issues/3549
      it('is true when DOM el and not jQuery el contains text', () => {
        cy.get('div').then(($el) => {
          cy.wrap($el[1]).should('contain', 'Nested Find')
        })
      })

      it('escapes quotes', () => {
        const $span = '<span id="escape-quotes">shouldn\'t and can"t</span>'

        cy.$$($span).appendTo(cy.$$('body'))

        cy.get('#escape-quotes').should('contain', 'shouldn\'t')
      })

      // https://github.com/cypress-io/cypress/issues/19116
      it('escapes backslashes', () => {
        const $span = '<span id="escape-backslashes">"&lt;OE_D]dQ\\</span>'

        cy.$$($span).appendTo(cy.$$('body'))

        cy.get('#escape-backslashes').should('contain', '"<OE_D]dQ\\')
      })
    })

    describe('#match', () => {
      it('calls super when provided a regex', () => {
        expect('foo').to.match(/foo/)
      })

      it('throws when not provided a regex', () => {
        const fn = () => {
          expect('foo').to.match('foo')
        }

        expect(fn).to.throw('`match` requires its argument be a `RegExp`. You passed: `foo`')
      })

      it('throws with cy.should', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`match` requires its argument be a `RegExp`. You passed: `bar`')

          done()
        })

        cy.noop('foo').should('match', 'bar')
      })

      it('does not affect DOM element matching', () => {
        cy.get('body').should('match', 'body')
      })
    })

    describe('#exist', () => {
      it('uses $el.selector in expectation', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **#does-not-exist** not to exist in the DOM')

            done()
          }
        })

        cy.get('#does-not-exist').should('not.exist')
      })
    })

    describe('#be.visible', () => {
      it('sets type to child', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('type')).to.eq('child')

            done()
          }
        })

        cy
        .get('body')
        .get('button').should('be.visible')
      })

      it('jquery wrapping els and selectors, not changing subject', () => {
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('not.be.visible')
        cy.wrap(cy.$$('<div></div>')).should('not.exist')
        cy.wrap(cy.$$('<div></div>').appendTo('body')).should('exist')
        cy.wrap(cy.$$('.non-existent')).should('not.exist')
      })

      // https://github.com/cypress-io/cypress/issues/205
      describe('does not pass not.visible for non-dom', function () {
        beforeEach(function () {
          return Cypress.config('defaultCommandTimeout', 50)
        })

        it('undefined', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap().should('not.be.visible')
        })

        it('null', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap(null).should('not.be.visible')
        })

        it('[]', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap([]).should('not.be.visible')
        })

        it('{}', function (done) {
          let spy

          spy = cy.spy(function (err) {
            expect(err.message).to.contain('attempted to make')

            return done()
          }).as('onFail')

          cy.on('fail', spy)

          return cy.wrap({}).should('not.be.visible')
        })

        it('fails not.visible for detached DOM', function (done) {
          cy.on('fail', (err) => {
            expect(err.message).include('`cy.should()` failed because the page updated')
            done()
          })

          cy.get('<div></div>').should('not.be.visible')
        })

        it('fails not.visible for non-existent DOM', function (done) {
          cy.on('fail', (err) => {
            // prints selector on failure
            // https://github.com/cypress-io/cypress/issues/5763
            expect(err.message).include('.non-existent')
            expect(err.message).include('Expected to find')
            done()
          })

          cy.get('.non-existent', { timeout: 10 }).should('not.visible')
        })
      })
    })

    describe('#have.length', () => {
      it('formats _obj with cypress', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('message')).to.eq('expected **<button>** to have a length of **1**')

            done()
          }
        })

        cy.get('button:first').should('have.length', 1)
      })

      it('formats error _obj with cypress', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')

            expect(log.get('_error').message).to.eq('expected \'<body>\' to have a length of 2 but got 1')

            done()
          }
        })

        cy.get('body').should('have.length', 2)
      })

      it('does not touch non DOM objects', () => {
        cy.noop([1, 2, 3]).should('have.length', 3)
      })

      it('rejects any element not in the document', function () {
        cy.$$('<button />').appendTo(this.$body)
        cy.$$('<button />').appendTo(this.$body)

        const buttons = cy.$$('button')

        const { length } = buttons

        cy.on('command:retry', _.after(2, () => {
          cy.$$('button:last').remove()
        }))

        cy.wrap(buttons).should('have.length', length - 1)
      })

      // https://github.com/cypress-io/cypress/issues/14484
      it('does not override user-defined error message', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Filter should have 1 items')

          done()
        })

        cy.get('div', { timeout: 100 }).should(($divs) => {
          expect($divs, 'Filter should have 1 items').to.have.length(1)
        })
      })
    })
  })

  context('chai plugins', () => {
    beforeEach(function () {
      this.logs = []

      this.clearLogs = () => {
        this.logs = []
      }

      cy.on('log:added', (attrs, log) => {
        this.logs?.push(log)
      })

      return null
    })

    context('data', () => {
      beforeEach(function () {
        this.$div = $('<div data-foo=\'bar\' />')
        this.$div.data = function () {
          throw new Error('data called')
        }
      })

      it('no prop, with prop, negation, and chainable', function () {
        expect(this.$div).to.have.data('foo') // 1
        expect(this.$div).to.have.data('foo', 'bar') // 2,3
        expect(this.$div).to.have.data('foo').and.eq('bar') // 4,5
        expect(this.$div).to.have.data('foo').and.match(/bar/) // 6,7
        expect(this.$div).not.to.have.data('baz') // 8

        assertLogLength(this.logs, 8)
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#data-number').then(($el) => {
          expect($el).to.have.data('number', 222)
          expect($el).not.to.have.data('number', '222')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.be.ok
          expect(err.message).to.include('> data')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.data('foo')
      })
    })

    context('class', () => {
      beforeEach(function () {
        this.$div = $('<div class=\'foo bar\' />')
        this.$div.hasClass = function () {
          throw new Error('hasClass called')
        }
      })

      it('class, not class', function () {
        expect(this.$div).to.have.class('foo') // 1
        expect(this.$div).to.have.class('bar') // 2
        expect(this.$div).not.to.have.class('baz') // 3

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **<div.foo.bar>** to have class **foo**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div.foo.bar>** not to have class **baz**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('.999').then(($el) => {
          expect($el).to.have.class(999)
          expect($el).to.have.class('999')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected \'foo\' to have class \'bar\'',
          )

          expect(err.message).to.include('> class')
          expect(err.message).to.include('> foo')

          done()
        })

        expect('foo').to.have.class('bar')
      })
    })

    context('id', () => {
      beforeEach(function () {
        this.$div = $('<div id=\'foo\' />')
        this.$div.prop = function () {
          throw new Error('prop called')
        }

        this.$div.attr = function () {
          throw new Error('attr called')
        }

        this.$div2 = $('<div />')
        this.$div2.prop('id', 'foo')
        this.$div2.prop = function () {
          throw new Error('prop called')
        }

        this.$div2.attr = function () {
          throw new Error('attr called')
        }

        this.$div3 = $('<div />')
        this.$div3.attr('id', 'foo')
        this.$div3.prop = function () {
          throw new Error('prop called')
        }

        this.$div3.attr = function () {
          throw new Error('attr called')
        }
      })

      it('id, not id', function () {
        expect(this.$div).to.have.id('foo') // 1
        expect(this.$div).not.to.have.id('bar') // 2

        expect(this.$div2).to.have.id('foo') // 3

        expect(this.$div3).to.have.id('foo') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div#foo>** to have id **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div#foo>** not to have id **bar**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#456').then(($el) => {
          expect($el).to.have.id(456)
          expect($el).to.have.id('456')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected [] to have id \'foo\'',
          )

          expect(err.message).to.include('> id')
          expect(err.message).to.include('> []')

          done()
        })

        expect([]).to.have.id('foo')
      })
    })

    context('html', () => {
      beforeEach(function () {
        this.$div = $('<div><button>button</button></div>')
        this.$div.html = function () {
          throw new Error('html called')
        }
      })

      it('html, not html, contain html', function () {
        expect(this.$div).to.have.html('<button>button</button>') // 1
        expect(this.$div).not.to.have.html('foo') // 2
        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have HTML **<button>button</button>**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have HTML **foo**',
        )

        this.clearLogs()
        expect(this.$div).to.contain.html('<button>')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** to contain HTML **<button>**',
        )

        this.clearLogs()
        expect(this.$div).to.not.contain.html('foo') // 4
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** not to contain HTML **foo**',
        )

        this.clearLogs()
        try {
          expect(this.$div).to.have.html('<span>span</span>')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to have HTML **<span>span</span>**, but the HTML was **<button>button</button>**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$div).to.contain.html('<span>span</span>')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to contain HTML **<span>span</span>**, but the HTML was **<button>button</button>**',
          )
        }
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected null to have HTML \'foo\'',
          )

          expect(err.message).to.include('> html')
          expect(err.message).to.include('> null')

          done()
        })

        expect(null).to.have.html('foo')
      })

      it('partial match', function () {
        expect(this.$div).to.contain.html('button')
        expect(this.$div).to.include.html('button')
        expect(this.$div).to.not.contain.html('span')

        cy.get('button').should('contain.html', 'button')
      })
    })

    context('text', () => {
      beforeEach(function () {
        this.$div = $('<div>foo</div>')
        this.$div.text = function () {
          throw new Error('text called')
        }
      })

      it('text, not text, contain text', function () {
        expect(this.$div).to.have.text('foo') // 1
        expect(this.$div).not.to.have.text('bar') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have text **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have text **bar**',
        )

        this.clearLogs()
        expect(this.$div).to.contain.text('f')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** to contain text **f**',
        )

        this.clearLogs()
        expect(this.$div).to.not.contain.text('foob')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<div>** not to contain text **foob**',
        )

        this.clearLogs()
        try {
          expect(this.$div).to.have.text('bar')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to have text **bar**, but the text was **foo**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$div).to.contain.text('bar')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<div>** to contain text **bar**, but the text was **foo**',
          )
        }
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#number').then(($el) => {
          expect($el).to.have.text(123)
        })
      })

      it('partial match', function () {
        expect(this.$div).to.have.text('foo')
        expect(this.$div).to.contain.text('o')
        expect(this.$div).to.include.text('o')
        cy.get('div').should('contain.text', 'iv').should('contain.text', 'd')

        cy.get('div').should('not.contain.text', 'fizzbuzz').should('contain.text', 'Nest')
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected undefined to have text \'foo\'',
          )

          expect(err.message).to.include('> text')
          expect(err.message).to.include('> undefined')

          done()
        })

        expect(undefined).to.have.text('foo')
      })
    })

    context('value', () => {
      beforeEach(function () {
        this.$input = $('<input value=\'foo\' />')
        this.$input.val = function () {
          throw new Error('val called')
        }
      })

      it('value, not value, contain value', function () {
        expect(this.$input).to.have.value('foo') // 1
        expect(this.$input).not.to.have.value('bar') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to have value **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to have value **bar**',
        )

        this.clearLogs()
        expect(this.$input).to.contain.value('foo')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<input>** to contain value **foo**',
        )

        this.clearLogs()
        expect(this.$input).not.to.contain.value('bar')
        expect(this.logs[0].get('message')).to.eq(
          'expected **<input>** not to contain value **bar**',
        )

        this.clearLogs()
        try {
          expect(this.$input).to.have.value('bar')
        } catch (error) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<input>** to have value **bar**, but the value was **foo**',
          )
        }

        this.clearLogs()
        try {
          expect(this.$input).to.contain.value('bar')
        } catch (error1) {
          expect(this.logs[0].get('message')).to.eq(
            'expected **<input>** to contain value **bar**, but the value was **foo**',
          )
        }
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#value-number').then(($el) => {
          expect($el).to.have.value(123)
          expect($el).to.have.value('123')
        })
      })

      // https://github.com/cypress-io/cypress/issues/7603
      describe('when the type of value attr must be number', () => {
        it('<progress>', () => {
          cy.$$('<progress id="progress" value="0.72">72%</progress>').appendTo(cy.$$('body'))
          cy.get('#progress').should('have.value', 0.72)
          cy.get('#progress').should('not.have.value', '0.72')
        })

        it('<meter>', () => {
          cy.$$('<meter id="meter" min="0" max="100" low="33" high="66" optimum="80" value="50">at 50/100</meter>').appendTo(cy.$$('body'))
          cy.get('#meter').should('have.value', 50)
          cy.get('#meter').should('not.have.value', '50')
        })

        it('<li>', () => {
          cy.$$('<li id="li" value="3">Cypress</li>').appendTo(cy.$$('body'))
          cy.get('#li').should('have.value', 3)
          cy.get('#li').should('not.have.value', '3')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have value \'foo\'',
          )

          expect(err.message).to.include('> value')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.value('foo')
      })

      it('partial match', function () {
        expect(this.$input).to.contain.value('oo')
        expect(this.$input).to.not.contain.value('oof')
        // make sure "includes" is an alias of "include"
        expect(this.$input).to.includes.value('oo')
        cy.get('input')
        .invoke('val', 'foobar')
        .should('contain.value', 'bar')
        .should('contain.value', 'foo')
        .should('include.value', 'foo')

        cy.wrap(null).then(() => {
          cy.$$('<input value="foo1">').prependTo(cy.$$('body'))

          cy.$$('<input value="foo2">').prependTo(cy.$$('body'))
        })

        cy.get('input').should(($els) => {
          expect($els).to.have.value('foo2')
          expect($els).to.contain.value('foo')

          expect($els).to.include.value('foo')
        }).should('contain.value', 'oo2')
      })

      // https://github.com/cypress-io/cypress/issues/14359
      it('shows undefined correctly', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')
            expect(log.get('message')).to.eq('expected **undefined** to have value **somevalue**')

            done()
          }
        })

        cy.wrap(undefined).should('have.value', 'somevalue')
      })

      it('shows subject instead of undefined when a previous traversal errors', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'assert') {
            cy.removeAllListeners('log:added')
            expect(log.get('message')).to.eq('expected **subject** to have class **updated**')
            done()
          }
        })

        cy.get('body')
        .contains('Does not exist')
        .should('have.class', 'updated')
      })
    })

    context('descendants', () => {
      beforeEach(function () {
        this.$div = $('<div><button>button</button></div>')
        this.$div.has = function () {
          throw new Error('has called')
        }
      })

      it('descendants, not descendants', function () {
        expect(this.$div).to.have.descendants('button') // 1
        expect(this.$div).not.to.have.descendants('input') // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have descendants **button**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to have descendants **input**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have descendants \'foo\'',
          )

          expect(err.message).to.include('> descendants')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.descendants('foo')
      })
    })

    context('visible', () => {
      beforeEach(function () {
        this.$div = $('<div>div</div>').appendTo($('body'))
        this.$div.is = function () {
          throw new Error('is called')
        }

        this.$div2 = $('<div style=\'display: none\'>div</div>').appendTo($('body'))
        this.$div2.is = function () {
          throw new Error('is called')
        }
      })

      afterEach(function () {
        this.$div.remove()

        this.$div2.remove()
      })

      it('visible, not visible, adds to error', function () {
        cy.once('fail', (err) => {
          const l6 = this.logs[5]

          // the error on this log should have this message appended to it
          expect(l6.get('error').message).to.include(`expected '<div>' to be 'visible'`)
          expect(err.message).to.include(`This element \`<div>\` is not visible because it has CSS property: \`display: none\``)
        })

        expect(this.$div).to.be.visible // 1
        expect(this.$div2).not.to.be.visible // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **visible**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **visible**',
        )

        expect(this.$div2).to.be.visible
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'visible\'',
          )

          expect(err.message).to.include('> visible')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.visible
      })
    })

    context('hidden', () => {
      beforeEach(function () {
        this.$div = $('<div style=\'display: none\'>div</div>').appendTo($('body'))
        this.$div.is = function () {
          throw new Error('is called')
        }

        this.$div2 = $('<div>div</div>').appendTo($('body'))
        this.$div2.is = function () {
          throw new Error('is called')
        }
      })

      afterEach(function () {
        this.$div.remove()

        this.$div2.remove()
      })

      it('hidden, not hidden, adds to error', function () {
        expect(this.$div).to.be.hidden // 1
        expect(this.$div2).not.to.be.hidden // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **hidden**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **hidden**',
        )

        try {
          expect(this.$div2).to.be.hidden
        } catch (err) {
          const l6 = this.logs[5]

          // the error on this log should have this message appended to it
          expect(l6.get('error').message).to.eq('expected \'<div>\' to be \'hidden\'')
        }
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'hidden\'',
          )

          expect(err.message).to.include('> hidden')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.hidden
      })
    })

    context('selected', () => {
      beforeEach(function () {
        this.$option = $('<option selected>option</option>')
        this.$option.is = function () {
          throw new Error('is called')
        }

        this.$option2 = $('<option>option</option>')
        this.$option2.is = function () {
          throw new Error('is called')
        }
      })

      it('selected, not selected', function () {
        expect(this.$option).to.be.selected // 1
        expect(this.$option2).not.to.be.selected // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<option>** to be **selected**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<option>** not to be **selected**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'selected\'',
          )

          expect(err.message).to.include('> selected')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.selected
      })
    })

    context('checked', () => {
      beforeEach(function () {
        this.$input = $('<input type=\'checkbox\' checked />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input type=\'checkbox\' />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('checked, not checked', function () {
        expect(this.$input).to.be.checked // 1
        expect(this.$input2).not.to.be.checked // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **checked**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **checked**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'checked\'',
          )

          expect(err.message).to.include('> checked')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.checked
      })
    })

    context('enabled', () => {
      beforeEach(function () {
        this.$input = $('<input />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input disabled />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('enabled, not enabled', function () {
        expect(this.$input).to.be.enabled // 1
        expect(this.$input2).not.to.be.enabled // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **enabled**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **enabled**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'enabled\'',
          )

          expect(err.message).to.include('> enabled')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.enabled
      })
    })

    context('disabled', () => {
      beforeEach(function () {
        this.$input = $('<input disabled />')
        this.$input.is = function () {
          throw new Error('is called')
        }

        this.$input2 = $('<input />')
        this.$input2.is = function () {
          throw new Error('is called')
        }
      })

      it('disabled, not disabled', function () {
        expect(this.$input).to.be.disabled // 1
        expect(this.$input2).not.to.be.disabled // 2

        assertLogLength(this.logs, 2)

        const l1 = this.logs[0]
        const l2 = this.logs[1]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to be **disabled**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** not to be **disabled**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to be \'disabled\'',
          )

          expect(err.message).to.include('> disabled')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.be.disabled
      })
    })

    context('exist', () => {
      it('passes thru non DOM', function () {
        expect([]).to.exist
        expect({}).to.exist
        expect('foo').to.exist

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **[]** to exist',
        )

        expect(l2.get('message')).to.eq(
          'expected **{}** to exist',
        )

        expect(l3.get('message')).to.eq(
          'expected **foo** to exist',
        )
      })
    })

    context('empty', () => {
      beforeEach(function () {
        this.div = $('<div></div>')
        this.div.is = function () {
          throw new Error('is called')
        }

        this.div2 = $('<div><button>button</button></div>')
        this.div2.is = function () {
          throw new Error('is called')
        }
      })

      it('passes thru non DOM', function () {
        expect([]).to.be.empty
        expect({}).to.be.empty
        expect('').to.be.empty

        assertLogLength(this.logs, 3)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]

        expect(l1.get('message')).to.eq(
          'expected **[]** to be empty',
        )

        expect(l2.get('message')).to.eq(
          'expected **{}** to be empty',
        )

        expect(l3.get('message')).to.eq(
          'expected **\'\'** to be empty',
        )
      })

      it('empty, not empty, raw dom documents', function () {
        expect(this.div).to.be.empty // 1
        expect(this.div2).not.to.be.empty // 2

        expect(this.div.get(0)).to.be.empty // 3
        expect(this.div2.get(0)).not.to.be.empty // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to be **empty**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to be **empty**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** to be **empty**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to be **empty**',
        )
      })
    })

    context('focused', () => {
      beforeEach(function () {
        this.div = $('<div id=\'div\' tabindex=0></div>').appendTo($('body'))
        this.div.is = function () {
          throw new Error('is called')
        }

        this.div2 = $('<div id=\'div2\' tabindex=1><button>button</button></div>').appendTo($('body'))
        this.div2.is = function () {
          throw new Error('is called')
        }
      })

      it('focus, not focus, raw dom documents', function () {
        expect(this.div).to.not.be.focused
        expect(this.div[0]).to.not.be.focused
        this.div.focus()
        expect(this.div).to.be.focused
        expect(this.div[0]).to.be.focused

        this.div.blur()
        expect(this.div).to.not.be.focused
        expect(this.div[0]).to.not.be.focused

        expect(this.div2).not.to.be.focused
        expect(this.div2[0]).not.to.be.focused
        this.div.focus()
        expect(this.div2).not.to.be.focused
        this.div2.focus()
        expect(this.div2).to.be.focused

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div#div>** not to be **focused**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div#div>** not to be **focused**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div#div>** to be **focused**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div#div>** to be **focused**',
        )
      })

      it('works with focused or focus', function () {
        expect(this.div).to.not.have.focus
        expect(this.div).to.not.have.focused
        expect(this.div).to.not.be.focus
        expect(this.div).to.not.be.focused

        cy.get('#div').should('not.be.focused')

        cy.get('#div').should('not.have.focus')
      })

      it('works with multiple elements', () => {
        cy.get('div:last').focus()
        cy.get('div').should('have.focus')
        cy.get('div:last').blur()

        cy.get('div').should('not.have.focus')
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.contain(
            'expected {} to be \'focused\'',
          )

          expect(err.message).to.include('> focus')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.focus
      })
    })

    context('match', () => {
      beforeEach(function () {
        this.div = $('<div></div>')
        this.div.is = function () {
          throw new Error('is called')
        }
      })

      it('passes thru non DOM', function () {
        expect('foo').to.match(/f/)

        assertLogLength(this.logs, 1)

        const l1 = this.logs[0]

        expect(l1.get('message')).to.eq(
          'expected **foo** to match /f/',
        )
      })

      it('match, not match, raw dom documents', function () {
        expect(this.div).to.match('div') // 1
        expect(this.div).not.to.match('button') // 2

        expect(this.div.get(0)).to.match('div') // 3
        expect(this.div.get(0)).not.to.match('button') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to match **div**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** not to match **button**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** to match **div**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to match **button**',
        )
      })
    })

    context('contain', () => {
      it('passes thru non DOM', function () {
        expect(['foo']).to.contain('foo') // 1
        expect({ foo: 'bar', baz: 'quux' }).to.contain({ foo: 'bar' }) // 2, 3
        expect('foo').to.contain('fo') // 4

        assertLogLength(this.logs, 4)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]

        expect(l1.get('message')).to.eq(
          'expected **[ foo ]** to include **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **{ foo: bar, baz: quux }** to have property **foo**',
        )

        expect(l3.get('message')).to.eq(
          'expected **{ foo: bar, baz: quux }** to have property **foo** of **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **foo** to include **fo**',
        )
      })
    })

    context('attr', () => {
      beforeEach(function () {
        this.$div = $('<div foo=\'bar\'>foo</div>')
        this.$div.attr = function () {
          throw new Error('attr called')
        }

        this.$a = $('<a href=\'https://google.com\'>google</a>')
        this.$a.attr = function () {
          throw new Error('attr called')
        }
      })

      it('attr, not attr', function () {
        expect(this.$div).to.have.attr('foo') // 1
        expect(this.$div).to.have.attr('foo', 'bar') // 2
        expect(this.$div).not.to.have.attr('bar') // 3
        expect(this.$div).not.to.have.attr('bar', 'baz') // 4
        expect(this.$div).not.to.have.attr('foo', 'baz') // 5

        expect(this.$a).to.have.attr('href').and.match(/google/) // 6, 7
        expect(this.$a)
        .to.have.attr('href', 'https://google.com') // 8
        .and.have.text('google') // 9

        try {
          expect(this.$a).not.to.have.attr('href', 'https://google.com') // 10
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]
        const l7 = this.logs[6]
        const l8 = this.logs[7]
        const l9 = this.logs[8]
        const l10 = this.logs[9]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have attribute **foo**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** to have attribute **foo** with the value **bar**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** not to have attribute **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to have attribute **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<div>** not to have attribute **foo** with the value **baz**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<a>** to have attribute **href**',
        )

        expect(l7.get('message')).to.eq(
          'expected **https://google.com** to match /google/',
        )

        expect(l8.get('message')).to.eq(
          'expected **<a>** to have attribute **href** with the value **https://google.com**',
        )

        expect(l9.get('message')).to.eq(
          'expected **<a>** to have text **google**',
        )

        expect(l10.get('message')).to.eq(
          'expected **<a>** not to have attribute **href** with the value **https://google.com**, but the value was **https://google.com**',
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#attr-number').then(($el) => {
          expect($el).to.have.attr('num', 777)
          expect($el).to.have.attr('num', '777')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have attribute \'foo\'',
          )

          expect(err.message).to.include('> attr')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.attr('foo')
      })
    })

    context('prop', () => {
      beforeEach(function () {
        this.$input = $('<input type=\'checkbox\' />')
        this.$input.prop('checked', true)
        this.$input.prop = function () {
          throw new Error('prop called')
        }

        this.$a = $('<a href=\'/foo\'>google</a>')
        this.$a.prop = function () {
          throw new Error('prop called')
        }
      })

      it('prop, not prop', function () {
        expect(this.$input).to.have.prop('checked') // 1
        expect(this.$input).to.have.prop('checked', true) // 2
        expect(this.$input).not.to.have.prop('bar') // 3
        expect(this.$input).not.to.have.prop('bar', 'baz') // 4
        expect(this.$input).not.to.have.prop('checked', 'baz') // 5

        const href = `${window.location.origin}/foo`

        expect(this.$a).to.have.prop('href').and.match(/foo/) // 6, 7
        expect(this.$a)
        .to.have.prop('href', href) // 8
        .and.have.text('google') // 9

        try {
          expect(this.$a).not.to.have.prop('href', href) // 10
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 10)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]
        const l7 = this.logs[6]
        const l8 = this.logs[7]
        const l9 = this.logs[8]
        const l10 = this.logs[9]

        expect(l1.get('message')).to.eq(
          'expected **<input>** to have property **checked**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<input>** to have property **checked** with the value **true**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<input>** not to have property **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<input>** not to have property **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<input>** not to have property **checked** with the value **baz**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<a>** to have property **href**',
        )

        expect(l7.get('message')).to.eq(
          `expected **${href}** to match /foo/`,
        )

        expect(l8.get('message')).to.eq(
          `expected **<a>** to have property **href** with the value **${href}**`,
        )

        expect(l9.get('message')).to.eq(
          'expected **<a>** to have text **google**',
        )

        expect(l10.get('message')).to.eq(
          `expected **<a>** not to have property **href** with the value **${href}**, but the value was **${href}**`,
        )
      })

      // https://github.com/cypress-io/cypress/issues/7314
      it('supports a number argument', () => {
        cy.get('#prop-number').then(($el) => {
          $el.prop('foo', 444)
          $el.prop('bar', '333')

          expect($el).to.have.prop('foo', 444)
          expect($el).not.to.have.prop('foo', '444')
          expect($el).not.to.have.prop('bar', 333)
          expect($el).to.have.prop('bar', '333')
        })
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have property \'foo\'',
          )

          expect(err.message).to.include('> prop')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.prop('foo')
      })
    })

    context('css', () => {
      beforeEach(function () {
        this.$div = $('<div style=\'display: none\'>div</div>')
        this.$div.css = function () {
          throw new Error('css called')
        }
      })

      it('css, not css', function () {
        expect(this.$div).to.have.css('display') // 1
        expect(this.$div).to.have.css('display', 'none') // 2
        expect(this.$div).not.to.have.css('bar') // 3
        expect(this.$div).not.to.have.css('bar', 'baz') // 4
        expect(this.$div).not.to.have.css('display', 'inline') // 5

        try {
          expect(this.$div).not.to.have.css('display', 'none') // 6
        } catch (error) {} // eslint-disable-line no-empty

        assertLogLength(this.logs, 6)

        const l1 = this.logs[0]
        const l2 = this.logs[1]
        const l3 = this.logs[2]
        const l4 = this.logs[3]
        const l5 = this.logs[4]
        const l6 = this.logs[5]

        expect(l1.get('message')).to.eq(
          'expected **<div>** to have CSS property **display**',
        )

        expect(l2.get('message')).to.eq(
          'expected **<div>** to have CSS property **display** with the value **none**',
        )

        expect(l3.get('message')).to.eq(
          'expected **<div>** not to have CSS property **bar**',
        )

        expect(l4.get('message')).to.eq(
          'expected **<div>** not to have CSS property **bar**',
        )

        expect(l5.get('message')).to.eq(
          'expected **<div>** not to have CSS property **display** with the value **inline**',
        )

        expect(l6.get('message')).to.eq(
          'expected **<div>** not to have CSS property **display** with the value **none**, but the value was **none**',
        )
      })

      it('throws when obj is not DOM', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)
          expect(this.logs[0].get('error').message).to.eq(
            'expected {} to have CSS property \'foo\'',
          )

          expect(err.message).to.include('> css')
          expect(err.message).to.include('> {}')

          done()
        })

        expect({}).to.have.css('foo')
      })
    })
  })

  context('cross-origin iframe', () => {
    it(`doesn't throw when iframe exists`, () => {
      cy.visit('fixtures/cross_origin.html')
      cy.get('.foo').should('not.exist')
    })

    it(`doesn't throw when iframe with name attribute exists`, () => {
      cy.visit('fixtures/cross_origin_name.html')
      cy.get('.foo').should('not.exist')
    })
  })

  context('implicit assertions', () => {
    // https://github.com/cypress-io/cypress/issues/18549
    // A targeted test for the above issue - in the absence of retries, only a single snapshot
    // should be taken.
    it('only snapshots once when failing to find DOM elements and not retrying', (done) => {
      cy.on('fail', (err) => {
        expect(testCommands()).to.eql([
          { name: 'visit', snapshots: 1, retries: 0 },
          { name: 'get', snapshots: 1, retries: 0 },
        ])

        done()
      })

      cy.get('.badId', { timeout: 0 })
    })

    // https://github.com/cypress-io/cypress/issues/18549
    // This issue was also causing two DOM snapshots to be taken every 50ms
    // while waiting for an element to exist. The first test is sufficient to
    // prevent regressions of the specific issue, but this one is intended to
    // more generally assert that retries do not trigger multiple snapshots.
    it('only snapshots once when retrying assertions', (done) => {
      cy.on('fail', (err) => {
        expect(testCommands()).to.containSubset([{
          name: 'get',
          snapshots: 1,
          retries: (v) => v > 1,
        }])

        done()
      })

      cy.get('.badId', { timeout: 1000 })
    })
  })
})
