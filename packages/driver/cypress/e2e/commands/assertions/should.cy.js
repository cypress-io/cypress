const { assertLogLength } = require('../../../support/utils')
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

  // Smoke tests for vanilla chai assertion aliases (chai owns their behavior);
  // we only verify they're reachable through Cypress's expect/assert/should
  // surfaces.
  context('chai aliases', () => {
    it('exists is an alias of exist', () => {
      expect(0).to.exists
      expect(null).to.not.exists
      cy.wrap('foo').should('exist')
    })

    it('greaterThanOrEqual is an alias of least/gte', () => {
      expect(2).to.be.greaterThanOrEqual(1)
      expect(2).to.be.greaterThanOrEqual(2)
      expect(2).to.not.be.greaterThanOrEqual(3)
      cy.wrap(2).should('be.greaterThanOrEqual', 2)
    })

    it('lessThanOrEqual is an alias of most/lte', () => {
      expect(1).to.be.lessThanOrEqual(2)
      expect(2).to.be.lessThanOrEqual(2)
      expect(2).to.not.be.lessThanOrEqual(1)
      cy.wrap(1).should('be.lessThanOrEqual', 2)
    })

    it('oneOf can be chained with contain', () => {
      expect('Today is sunny').to.contain.oneOf(['sunny', 'cloudy'])
      expect([1, 2, 3]).to.contain.oneOf([3, 4, 5])
      expect([1, 2, 3]).to.not.contain.oneOf([4, 5, 6])
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
