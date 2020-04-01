const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress
const {
  Promise,
} = Cypress

describe('src/cy/commands/connectors', () => {
  describe('with jquery', () => {
    before(() => {
      cy
      .visit('/fixtures/jquery.html')
      .then(function (win) {
        this.body = win.document.body.outerHTML
      })
    })

    beforeEach(() => {
      const doc = cy.state('document')

      return $(doc.body).empty().html(this.body)
    })

    context('#spread', () => {
      it('spreads an array into individual arguments', () => {
        cy.noop([1, 2, 3]).spread((one, two, three) => {
          expect(one).to.eq(1)
          expect(two).to.eq(2)

          expect(three).to.eq(3)
        })
      })

      it('spreads a jQuery wrapper into individual arguments', () => {
        cy.noop($('div')).spread((first, second) => {
          expect(first.tagName).to.eq('DIV')
          expect(first.innerText).to.eq('div')
          expect(second.tagName).to.eq('DIV')

          expect(second.innerText).to.contain('Nested Find')
        })
      })

      it('passes timeout option to spread', () => {
        cy.timeout(50)

        cy.noop([1, 2, 3]).spread({ timeout: 150 }, (one, two, three) => Promise.delay(100))
      })

      describe('errors', () => {
        beforeEach(() => Cypress.config('defaultCommandTimeout', 50))

        it('throws when subject isn\'t array-like', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.spread()` requires the existing subject be array-like.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/spread')

            done()
          })

          cy.noop({}).spread(() => {})
        })

        it('throws when promise timeout', (done) => {
          const logs = []

          cy.on('log:added', (attrs, log) => {
            return (logs != null ? logs.push(log) : undefined)
          })

          cy.on('fail', (err) => {
            expect(logs.length).to.eq(1)
            expect(logs[0].get('error')).to.eq(err)
            expect(err.message).to.include('`cy.spread()` timed out after waiting `20ms`.')

            done()
          })

          cy.noop([1, 2, 3]).spread({ timeout: 20 }, () => new Promise((resolve, reject) => {}))
        })
      })
    })

    context('#then', () => {
      it('converts raw DOM elements', () => {
        const div = cy.$$('div:first').get(0)

        cy.wrap(div).then(($div) => expect($div.get(0)).to.eq(div))
      })

      it('does not insert a mocha callback', () => cy.noop().then(() => expect(cy.queue.length).to.eq(2)))

      it('passes timeout option to then', () => {
        cy.timeout(50)

        cy.then({ timeout: 150 }, () => Promise.delay(100))
      })

      it('can resolve nested thens', () => cy.get('div:first').then(() => cy.get('div:first').then(() => cy.get('div:first'))))

      it('can resolve cypress commands inside of a promise', () => {
        let _then = false

        cy.wrap(null).then(() => Promise.delay(10).then(() => cy.then(() => _then = true))).then(() => expect(_then).to.be.true)
      })

      it('can resolve chained cypress commands inside of a promise', () => {
        let _then = false

        cy.wrap(null).then(() => Promise.delay(10).then(() => cy.get('div:first').then(() => _then = true))).then(() => expect(_then).to.be.true)
      })

      it('can resolve cypress instance inside of a promise', () => {
        cy.then(() => {
          return Promise.delay(10).then(() => {
            cy
          })
        })
      })

      it('passes values to the next command', () => {
        cy
        .wrap({ foo: 'bar' }).then((obj) => obj.foo).then((val) => expect(val).to.eq('bar'))
      })

      it('does not throw when returning thenables with cy commands', () => {
        cy
        .wrap({ foo: 'bar' })
        .then((obj) => {
          return new Promise((resolve) => {
            cy.wait(10)

            return resolve(obj.foo)
          })
        })
      })

      it('should pass the eventual resolved thenable value downstream', () => {
        cy
        .wrap({ foo: 'bar' })
        .then((obj) => {
          cy
          .wait(10)
          .then(() => obj.foo).then((value) => {
            expect(value).to.eq('bar')

            return value
          })
        }).then((val) => expect(val).to.eq('bar'))
      })

      it('should not pass the eventual resolve thenable value downstream because thens are not connected', () => {
        cy
        .wrap({ foo: 'bar' })
        .then((obj) => {
          cy
          .wait(10)
          .then(() => obj.foo).then((value) => {
            expect(value).to.eq('bar')

            return value
          })
        })

        cy.then((val) => expect(val).to.be.undefined)
      })

      it('passes the existing subject if ret is undefined', () => cy.wrap({ foo: 'bar' }).then((obj) => undefined).then((obj) => expect(obj).to.deep.eq({ foo: 'bar' })))

      it('sets the subject to null when given null', () => cy.wrap({ foo: 'bar' }).then((obj) => null).then((obj) => expect(obj).to.be.null))

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('throws when promise timeout', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(this.logs.length).to.eq(1)
            expect(lastLog.get('error')).to.eq(err)
            expect(err.message).to.include('`cy.then()` timed out after waiting `150ms`.')

            done()
          })

          cy.then({ timeout: 150 }, () => new Promise((resolve, reject) => {}))
        })

        it('throws when mixing up async + sync return values', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(this.logs.length).to.eq(1)
            expect(lastLog.get('error')).to.eq(err)
            expect(err.message).to.include('`cy.then()` failed because you are mixing up async and sync code.')

            done()
          })

          cy.then(() => {
            cy.wait(5000)

            return 'foo'
          })
        })

        it('unbinds command:enqueued in the case of an error thrown', function (done) {
          const listeners = []

          cy.on('fail', (err) => {
            listeners.push(cy.listeners('command:enqueued').length)

            expect(this.logs.length).to.eq(1)
            expect(listeners).to.deep.eq([1, 0])

            done()
          })

          cy.then(() => {
            listeners.push(cy.listeners('command:enqueued').length)

            throw new Error('foo')
          })
        })
      })

      describe('yields to remote jQuery subject', () => {
        beforeEach(() => {
          this.remoteWindow = cy.state('window')
        })

        it('calls the callback function with the remote jQuery subject', () => {
          // eslint-disable-next-line no-unused-vars
          let fn

          this.remoteWindow.$.fn.foo = (fn = () => {})

          cy
          .get('div:first').then(function ($div) {
            expect($div).to.be.instanceof(this.remoteWindow.$)

            return $div
          }).then(function ($div) {
            expect($div).to.be.instanceof(this.remoteWindow.$)
          })
        })

        it('does not store the remote jquery object as the subject', () => {
          cy
          .get('div:first').then(function ($div) {
            expect($div).to.be.instanceof(this.remoteWindow.$)

            return $div
          }).then(function ($div) {
            expect(cy.state('subject')).not.to.be.instanceof(this.remoteWindow.$)
          })
        })
      })
    })

    context('#invoke', () => {
      beforeEach(() => {
        this.remoteWindow = cy.state('window')
      })

      describe('assertion verification', () => {
        beforeEach(() => {
          delete this.remoteWindow.$.fn.foo

          Cypress.config('defaultCommandTimeout', 100)

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('eventually passes the assertion', () => {
          cy.on('command:retry', _.after(2, () => {
            this.remoteWindow.$.fn.foo = () => 'foo'
          }))

          cy.get('div:first').invoke('foo').should('eq', 'foo').then(() => {
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
            this.remoteWindow.$.fn.foo = () => 'foo'
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

          cy.get('div:first').invoke('foo').should('eq', 'bar')
        })

        it('can still fail on invoke', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include(lastLog.get('error').message)
            expect(err.message).not.to.include('undefined')
            expect(lastLog.get('name')).to.eq('invoke')
            expect(lastLog.get('state')).to.eq('failed')

            done()
          })

          cy.get('div:first').invoke('foobarbaz')
        })

        it('does not log an additional log on failure', function (done) {
          this.remoteWindow.$.fn.foo = () => 'foo'

          cy.on('fail', () => {
            expect(this.logs.length).to.eq(3)

            done()
          })

          cy.get('div:first').invoke('foo').should('eq', 'bar')
        })
      })

      describe('remote DOM subjects', () => {
        it('is invoked on the remote DOM subject', () => {
          this.remoteWindow.$.fn.foo = () => 'foo'

          cy.get('div:first').invoke('foo').then((str) => expect(str).to.eq('foo'))
        })

        it('re-wraps the remote element if its returned', () => {
          const parent = cy.$$('div:first').parent()

          expect(parent).to.exist

          cy.get('div:first').invoke('parent').then(function ($parent) {
            expect($parent).to.be.instanceof(this.remoteWindow.$)

            expect(cy.state('subject')).to.match(parent)
          })
        })
      })

      describe('function property', () => {
        beforeEach(() => {
          this.obj = {
            foo () {
              return 'foo'
            },
            bar (num1, num2) {
              return num1 + num2
            },
            err () {
              throw new Error('fn.err failed.')
            },
            baz: 10,
          }
        })

        it('changes subject to function invocation', () => {
          cy.noop(this.obj).invoke('foo').then((str) => expect(str).to.eq('foo'))
        })

        it('works with numerical indexes', () => {
          let i = 0
          const fn = () => {
            i++

            return i === 5
          }

          cy.noop([_.noop, fn]).invoke(1).should('be.true')
        })

        it('works with 0 as a value if object has property 0', () => {
          let i = 0
          const fn = () => {
            if (i++ === 0) {
              return 'cy.noop is undocumented'
            }

            return 'and I don\'t understand what it is'
          }

          cy.wrap([fn, 'bar']).invoke(0).should('eq', 'cy.noop is undocumented')

          cy.wrap({ '0': fn }).invoke(0).should('eq', 'and I don\'t understand what it is')
        })

        it('forwards any additional arguments', () => {
          cy.noop(this.obj).invoke('bar', 1, 2).then((num) => expect(num).to.eq(3))

          const obj = {
            bar () {
              return undefined
            },
          }

          cy.noop(obj).invoke('bar').then((val) => expect(val).to.be.undefined)
        })

        it('invokes reduced prop', () => {
          const obj = {
            foo: {
              bar: {
                baz () {
                  return 'baz'
                },
              },
            },
          }

          cy.wrap(obj).invoke('foo.bar.baz').should('eq', 'baz')
        })

        it('handles properties on the prototype', () => {
          const num = new Number(10)

          cy.noop(num).invoke('valueOf').then((num) => expect(num).to.eq(10))
        })

        it('retries until function exists on the subject', () => {
          const obj = {}

          cy.on('command:retry', _.after(3, () => obj.foo = () => 'bar'))

          cy.wrap(obj).invoke('foo').then((val) => expect(val).to.eq('bar'))
        })

        it('retries until property is a function', () => {
          const obj = {
            foo: '',
          }

          cy.on('command:retry', _.after(3, () => obj.foo = () => 'bar'))

          cy.wrap(obj).invoke('foo').then((val) => expect(val).to.eq('bar'))
        })

        it('retries until property is a function when initially undefined', () => {
          const obj = {
            foo: undefined,
          }

          cy.on('command:retry', _.after(3, () => obj.foo = () => 'bar'))

          cy.wrap(obj).invoke('foo').then((val) => expect(val).to.eq('bar'))
        })

        it('retries until value matches assertions', () => {
          const obj = {
            foo () {
              return 'foo'
            },
          }

          cy.on('command:retry', _.after(3, () => obj.foo = () => 'bar'))

          cy.wrap(obj).invoke('foo').should('eq', 'bar')
        });

        [null, undefined].forEach((val) => {
          it(`changes subject to '${val}' without throwing default assertion existence`, () => {
            const obj = {
              foo () {
                return val
              },
            }

            cy.wrap(obj).invoke('foo').then((val2) => expect(val2).to.eq(val))
          })
        })

        describe('errors', () => {
          beforeEach(() => Cypress.config('defaultCommandTimeout', 50))

          it('bubbles up automatically', function (done) {
            cy.on('fail', (err) => {
              expect(err.message).to.include('fn.err failed.')

              done()
            })

            cy.noop(this.obj).invoke('err')
          })

          it('throws when prop is not a function', (done) => {
            const obj = {
              foo: /re/,
            }

            cy.on('fail', (err) => {
              expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because the property: `foo` returned a `regexp` value instead of a function. `cy.invoke()` can only be used on properties that return callable functions.')
              expect(err.message).to.include('`cy.invoke()` waited for the specified property `foo` to return a function, but it never did.')
              expect(err.message).to.include('If you want to assert on the property\'s value, then switch to use `cy.its()` and add an assertion such as:')
              expect(err.message).to.include('`cy.wrap({ foo: \'bar\' }).its(\'foo\').should(\'eq\', \'bar\')`')
              expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')

              done()
            })

            cy.wrap(obj).invoke('foo')
          })

          it('throws when reduced prop is not a function', (done) => {
            const obj = {
              foo: {
                bar: 'bar',
              },
            }

            cy.on('fail', (err) => {
              expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because the property: `bar` returned a `string` value instead of a function. `cy.invoke()` can only be used on properties that return callable functions.')
              expect(err.message).to.include('`cy.invoke()` waited for the specified property `bar` to return a function, but it never did.')
              expect(err.message).to.include('If you want to assert on the property\'s value, then switch to use `cy.its()` and add an assertion such as:')
              expect(err.message).to.include('`cy.wrap({ foo: \'bar\' }).its(\'foo\').should(\'eq\', \'bar\')`')
              expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')

              done()
            })

            cy.wrap(obj).invoke('foo.bar')
          })
        })
      })

      describe('accepts a options argument', () => {
        it('changes subject to function invocation', () => {
          cy.noop({ foo () {
            return 'foo'
          } }).invoke({ log: false }, 'foo').then((str) => expect(str).to.eq('foo'))
        })

        it('forwards any additional arguments', () => {
          cy.noop({ bar (num1, num2) {
            return num1 + num2
          } }).invoke({ log: false }, 'bar', 1, 2).then((num) => expect(num).to.eq(3))

          cy.noop({ bar () {
            return undefined
          } }).invoke({ log: false }, 'bar').then((val) => expect(val).to.be.undefined)
        })

        it('works with numerical indexes', () => {
          let i = 0
          const fn = () => {
            i++

            return i === 5
          }

          cy.noop([_.noop, fn]).invoke({}, 1).should('be.true')
        })

        describe('errors', () => {
          beforeEach(() => {
            Cypress.config('defaultCommandTimeout', 50)

            cy.on('log:added', (attrs, log) => {
              this.lastLog = log
            })

            return null
          })

          it('throws when function name is missing', function (done) {
            cy.on('fail', (err) => {
              const {
                lastLog,
              } = this

              expect(err.message).to.include('`cy.invoke()` expects the functionName argument to have a value')
              expect(lastLog.get('error').message).to.include(err.message)

              done()
            })

            cy.wrap({ foo () {
              return 'foo'
            } }).invoke({})
          })

          it('throws when function name is not of type string but of type boolean', function (done) {
            cy.on('fail', (err) => {
              const {
                lastLog,
              } = this

              expect(err.message).to.include('`cy.invoke()` only accepts a string or a number as the functionName argument.')
              expect(lastLog.get('error').message).to.include(err.message)

              done()
            })

            cy.wrap({ foo () {
              return 'foo'
            } }).invoke({}, true)
          })

          it('throws when function name is not of type string but of type function', function (done) {
            cy.on('fail', (err) => {
              const {
                lastLog,
              } = this

              expect(err.message).to.include('`cy.invoke()` only accepts a string or a number as the functionName argument.')
              expect(lastLog.get('error').message).to.include(err.message)

              done()
            })

            cy.wrap({ foo () {
              return 'foo'
            } }).invoke(() => ({}))
          })

          it('throws when first parameter is neither of type object nor of type string nor of type number', function (done) {
            cy.on('fail', (err) => {
              const {
                lastLog,
              } = this

              expect(err.message).to.include('`cy.invoke()` only accepts a string or a number as the functionName argument.')
              expect(lastLog.get('error').message).to.include(err.message)

              done()
            })

            cy.wrap({ foo () {
              return 'foo'
            } }).invoke(true, 'show')
          })
        })

        describe('.log', () => {
          beforeEach(() => {
            this.obj = {
              foo: 'foo bar baz',
              num: 123,
              bar () {
                return 'bar'
              },
              attr (key, value) {
                const obj = {}

                obj[key] = value

                return obj
              },
              sum (a, b) {
                return a + b
              },
            }

            cy.on('log:added', (attrs, log) => {
              this.lastLog = log
            })

            return null
          })

          it('logs obj as a function', () => {
            cy.noop(this.obj).invoke({ log: true }, 'bar').then(() => {
              const obj = {
                name: 'invoke',
                message: '.bar()',
              }

              const {
                lastLog,
              } = this

              return _.each(obj, (value, key) => {
                expect(lastLog.get(key)).to.deep.eq(value)
              })
            })
          })

          it('logs obj with arguments', () => {
            cy.noop(this.obj).invoke({ log: true }, 'attr', 'numbers', [1, 2, 3]).then(() => {
              expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
                Command: 'invoke',
                Function: '.attr(numbers, [1, 2, 3])',
                'With Arguments': ['numbers', [1, 2, 3]],
                Subject: this.obj,
                Yielded: { numbers: [1, 2, 3] },
              })
            })
          })

          it('can be disabled', () => {
            cy.noop(this.obj).invoke({ log: true }, 'sum', 1, 2).then(() => {
              expect(this.lastLog.invoke('consoleProps')).to.have.property('Function', '.sum(1, 2)')
              this.lastLog = undefined
            })

            cy.noop(this.obj).invoke({ log: false }, 'sum', 1, 2).then(() => {
              expect(this.lastLog).to.be.undefined
            })
          })
        })
      })

      describe('.log', () => {
        beforeEach(() => {
          this.obj = {
            foo: 'foo bar baz',
            num: 123,
            bar () {
              return 'bar'
            },
            attr (key, value) {
              const obj = {}

              obj[key] = value

              return obj
            },
            sum (...args) {
              return _.reduce(args, (memo, num) => memo + num
                , 0)
            },
            math: {
              sum: (...args) => {
                return this.obj.sum(...args)
              },
            },
          }

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('logs $el if subject is element', () => {
          cy.get('div:first').invoke('hide').then(function ($el) {
            const {
              lastLog,
            } = this

            expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
          })
        })

        it('does not log $el if subject isnt element', () => {
          cy.noop(this.obj).invoke('bar').then(() => {
            const {
              lastLog,
            } = this

            expect(lastLog.get('$el')).not.to.exist
          })
        })

        it('logs obj as a function', () => {
          cy.noop(this.obj).invoke('bar').then(() => {
            const obj = {
              name: 'invoke',
              message: '.bar()',
            }

            const {
              lastLog,
            } = this

            return _.each(obj, (value, key) => {
              expect(lastLog.get(key)).to.deep.eq(value)
            })
          })
        })

        it('logs obj with arguments', () => {
          cy.noop(this.obj).invoke('attr', 'numbers', [1, 2, 3]).then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'invoke',
              Function: '.attr(numbers, [1, 2, 3])',
              'With Arguments': ['numbers', [1, 2, 3]],
              Subject: this.obj,
              Yielded: { numbers: [1, 2, 3] },
            })
          })
        })

        it('#consoleProps as a function property without args', () => {
          cy.noop(this.obj).invoke('bar').then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'invoke',
              Function: '.bar()',
              Subject: this.obj,
              Yielded: 'bar',
            })
          })
        })

        it('#consoleProps as a function property with args', () => {
          cy.noop(this.obj).invoke('sum', 1, 2, 3).then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'invoke',
              Function: '.sum(1, 2, 3)',
              'With Arguments': [1, 2, 3],
              Subject: this.obj,
              Yielded: 6,
            })
          })
        })

        it('#consoleProps as a function reduced property with args', () => {
          cy.noop(this.obj).invoke('math.sum', 1, 2, 3).then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'invoke',
              Function: '.math.sum(1, 2, 3)',
              'With Arguments': [1, 2, 3],
              Subject: this.obj,
              Yielded: 6,
            })
          })
        })

        it('#consoleProps as a function on DOM element', () => {
          cy.get('div:first').invoke('hide').then(function ($btn) {
            const consoleProps = this.lastLog.invoke('consoleProps')

            expect(consoleProps).to.deep.eq({
              Command: 'invoke',
              Function: '.hide()',
              Subject: $btn.get(0),
              Yielded: $btn.get(0),
            })
          })
        })
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('throws when property does not exist on the subject', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because the property: `foo` does not exist on your subject.')
            expect(err.message).to.include('`cy.invoke()` waited for the specified property `foo` to exist, but it never did.')
            expect(err.message).to.include('If you do not expect the property `foo` to exist, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: \'bar\' }).its(\'quux\').should(\'not.exist\')`')
            expect(lastLog.get('error').message).to.include(err.message)
            expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')

            done()
          })

          cy.wrap({}).invoke('foo')
        })

        it('throws without a subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('cy.invoke("queue")')
            expect(err.message).to.include('child command before running a parent command')

            done()
          })

          cy.invoke('queue')
        })

        it('logs once when not dom subject', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(this.logs.length).to.eq(1)
            expect(lastLog.get('error')).to.eq(err)

            done()
          })

          cy.invoke({})
        })

        it('throws when failing assertions', function (done) {
          const obj = {
            foo () {
              return 'foo'
            },
          }

          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.eq('Timed out retrying: expected \'foo\' to equal \'bar\'')

            expect(lastLog.get('error').message).to.eq('Timed out retrying: expected \'foo\' to equal \'bar\'')

            done()
          })

          cy.wrap(obj).invoke('foo').should('eq', 'bar')
        })

        it('throws when initial subject is undefined', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because your subject is: `undefined`. You cannot invoke any functions such as `foo` on a `undefined` value.')
            expect(err.message).to.include('If you expect your subject to be `undefined`, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap(undefined).should(\'be.undefined\')`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap(undefined).invoke('foo')
        })

        it('throws when property value is undefined', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because the property: `foo` is not a function, and instead returned a `undefined` value.')
            expect(err.message).to.include('`cy.invoke()` waited for the specified property `foo` to become a callable function, but it never did.')
            expect(err.message).to.include('If you expect the property `foo` to be `undefined`, then switch to use `cy.its()` and add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: undefined }).its(\'foo\').should(\'be.undefined\')`')
            expect(lastLog.get('error').message).to.include(err.message)
            expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')

            done()
          })

          cy.wrap({ foo: undefined }).invoke('foo')
        })

        it('throws when nested property value is undefined', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.invoke()` errored because the property: `baz` does not exist on your subject.')
            expect(lastLog.get('error').message).to.include(err.message)
            expect(err.docsUrl).to.eq('https://on.cypress.io/invoke')

            done()
          })

          const obj = {
            foo: {
              bar: {},
            },
          }

          cy.wrap(obj).invoke('foo.bar.baz.fizz')
        })
      })
    })

    context('#its', () => {
      beforeEach(() => {
        this.remoteWindow = cy.state('window')
      })

      it('proxies to #invokeFn', () => {
        const fn = () => 'bar'

        cy.wrap({ foo: fn }).its('foo').should('eq', fn)
      })

      it('works with numerical indexes', () => cy.wrap(['foo', 'bar']).its(1).should('eq', 'bar'))

      it('works with 0 as a value if object has property 0', () => {
        cy.wrap(['foo', 'bar']).its(0).should('eq', 'foo')
        cy.wrap({ '0': 'whoa' }).its(0).should('eq', 'whoa')

        // eslint-disable-next-line no-sparse-arrays
        cy.wrap([/*empty*/, 'spooky']).its(0).should('not.exist')
      })

      it('reduces into dot separated values', () => {
        const obj = {
          foo: {
            bar: {
              baz: 'baz',
            },
          },
        }

        cy.wrap(obj).its('foo.bar.baz').should('eq', 'baz')
      })

      it('does not invoke a function and uses as a property', () => {
        const fn = () => 'fn'

        fn.bar = 'bar'

        cy.wrap(fn).its('bar').should('eq', 'bar')
      })

      it('does not invoke a function with multiple its', () => {
        const fn = () => 'fn'

        fn.bar = () => 'bar'
        fn.bar.baz = 'baz'

        cy.wrap(fn).its('bar').its('baz').should('eq', 'baz')
      })

      it('does not invoke a function and uses as a reduced property', () => {
        const fn = () => 'fn'

        fn.bar = () => 'bar'
        fn.bar.baz = 'baz'

        const obj = {
          foo: fn,
        }

        cy.wrap(obj).its('foo.bar.baz').should('eq', 'baz')
      })

      it('does not invoke a function and can assert it throws', () => {
        const err = new Error('nope cant access me')

        const obj = {
          foo () {
            throw err
          },
        }

        cy.wrap(obj).its('foo').should('throw', 'nope cant access me')
      })

      it('returns property', () => cy.noop({ baz: 'baz' }).its('baz').then((num) => expect(num).to.eq('baz')))

      it('returns property on remote subject', () => {
        this.remoteWindow.$.fn.baz = 123

        cy.get('div:first').its('baz').then((num) => expect(num).to.eq(123))
      })

      it('handles string subjects', () => {
        const str = 'foobarbaz'

        cy.noop(str).its('length').then((num) => expect(num).to.eq(str.length))
      })

      it('handles number subjects', () => {
        const num = 12345

        const {
          toFixed,
        } = top.Number.prototype

        cy.wrap(num).its('toFixed').should('eq', toFixed)
      })

      it('retries by default until property exists without an assertion', () => {
        const obj = {}

        cy.on('command:retry', _.after(3, () => obj.foo = 'bar'))

        cy.wrap(obj).its('foo').then((val) => expect(val).to.eq('bar'))
      })

      it('retries until property is not undefined without an assertion', () => {
        const obj = {
          foo: undefined,
        }

        cy.on('command:retry', _.after(3, () => obj.foo = 'bar'))

        cy.wrap(obj).its('foo').then((val) => expect(val).to.eq('bar'))
      })

      it('retries until property is not null without an assertion', () => {
        const obj = {
          foo: null,
        }

        cy.on('command:retry', _.after(3, () => obj.foo = 'bar'))

        cy.wrap(obj).its('foo').then((val) => expect(val).to.eq('bar'))
      })

      it('retries when yielded undefined value and using assertion', () => {
        const obj = { foo: '' }

        cy.stub(obj, 'foo').get(
          cy.stub()
          .onCall(0).returns(undefined)
          .onCall(1).returns(undefined)
          .onCall(2).returns(true),
        )

        cy.wrap(obj).its('foo').should('eq', true)
      })

      it('retries until property does NOT exist with an assertion', () => {
        const obj = {
          foo: '',
        }

        cy.on('command:retry', _.after(3, () => delete obj.foo))

        cy.wrap(obj).its('foo').should('not.exist').then((val) => expect(val).to.be.undefined)
      })

      it('passes when property does not exist on the subject with assertions', () => {
        cy.wrap({}).its('foo').should('not.exist')
        cy.wrap({}).its('foo').should('be.undefined')
        cy.wrap({}).its('foo').should('not.be.ok')

        // TODO: should these really pass here?
        // isn't this the same situation as: cy.should('not.have.class', '...')
        //
        // when we use the 'eq' and 'not.eq' chainer aren't we effectively
        // saying that it must *have* a value as opposed to the property not
        // existing at all?
        //
        // does a tree falling in the forest really make a sound?
        cy.wrap({}).its('foo').should('eq', undefined)

        cy.wrap({}).its('foo').should('not.eq', 'bar')
      })

      it('passes when nested property does not exist on the subject with assertions', () => {
        const obj = {
          foo: {},
        }

        cy.wrap(obj).its('foo').should('not.have.property', 'bar')
        cy.wrap(obj).its('foo.bar').should('not.exist')

        cy.wrap(obj).its('foo.bar.baz').should('not.exist')
      })

      it('passes when property value is null with assertions', () => {
        const obj = {
          foo: null,
        }

        cy.wrap(obj).its('foo').should('be.null')

        cy.wrap(obj).its('foo').should('eq', null)
      })

      it('passes when property value is undefined with assertions', () => {
        const obj = {
          foo: undefined,
        }

        cy.wrap(obj).its('foo').should('be.undefined')

        cy.wrap(obj).its('foo').should('eq', undefined)
      })

      describe('accepts a options argument and works as without options argument', () => {
        it('proxies to #invokeFn', () => {
          const fn = () => 'bar'

          cy.wrap({ foo: fn }).its('foo', { log: false }).should('eq', fn)
        })

        it('does not invoke a function and uses as a property', () => {
          const fn = () => 'fn'

          fn.bar = 'bar'

          cy.wrap(fn).its('bar', { log: false }).should('eq', 'bar')
        })

        it('works with numerical indexes', () => cy.wrap(['foo', 'bar']).its(1, {}).should('eq', 'bar'))

        describe('.log', () => {
          beforeEach(() => {
            this.obj = {
              foo: 'foo bar baz',
              num: 123,
            }

            cy.on('log:added', (attrs, log) => {
              this.lastLog = log
            })

            return null
          })

          it('logs obj as a property', () => {
            cy.noop(this.obj).its('foo', { log: true }).then(() => {
              const obj = {
                name: 'its',
                message: '.foo',
              }

              const {
                lastLog,
              } = this

              return _.each(obj, (value, key) => {
                expect(lastLog.get(key)).to.deep.eq(value)
              })
            })
          })

          it('#consoleProps as a regular property', () => {
            cy.noop(this.obj).its('num', { log: true }).then(() => {
              expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
                Command: 'its',
                Property: '.num',
                Subject: this.obj,
                Yielded: 123,
              })
            })
          })
        })
      })

      describe('.log', () => {
        beforeEach(() => {
          this.obj = {
            foo: 'foo bar baz',
            num: 123,
            bar () {
              return 'bar'
            },
            attr (key, value) {
              const obj = {}

              obj[key] = value

              return obj
            },
            sum (...args) {
              return _.reduce(args, (memo, num) => memo + num
                , 0)
            },
            baz () {},
          }

          this.obj.baz.quux = () => 'quux'
          this.obj.baz.lorem = 'ipsum'

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('logs immediately before resolving', (done) => {
          cy.on('log:added', (attrs, log) => {
            if (log.get('name') === 'its') {
              expect(log.get('state')).to.eq('pending')
              expect(log.get('message')).to.eq('.foo')

              done()
            }
          })

          cy.noop({ foo: 'foo' }).its('foo')
        })

        it('snapshots after invoking', () => {
          cy.noop({ foo: 'foo' }).its('foo').then(() => {
            const {
              lastLog,
            } = this

            expect(lastLog.get('snapshots').length).to.eq(1)

            expect(lastLog.get('snapshots')[0]).to.be.an('object')
          })
        })

        it('ends', () => {
          cy.noop({ foo: 'foo' }).its('foo').then(() => {
            const {
              lastLog,
            } = this

            expect(lastLog.get('state')).to.eq('passed')

            expect(lastLog.get('ended')).to.be.true
          })
        })

        it('logs obj as a property', () => {
          cy.noop(this.obj).its('foo').then(() => {
            const obj = {
              name: 'its',
              message: '.foo',
            }

            const {
              lastLog,
            } = this

            return _.each(obj, (value, key) => {
              expect(lastLog.get(key)).to.deep.eq(value)
            })
          })
        })

        it('#consoleProps as a regular property', () => {
          cy.noop(this.obj).its('num').then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'its',
              Property: '.num',
              Subject: this.obj,
              Yielded: 123,
            })
          })
        })

        it('can be disabled', () => {
          cy.noop(this.obj).its('num', { log: true }).then(() => {
            expect(this.lastLog.invoke('consoleProps')).to.have.property('Property', '.num')
            this.lastLog = undefined
          })

          cy.noop(this.obj).its('num', { log: false }).then(() => {
            expect(this.lastLog).to.be.undefined
          })
        })
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'its') {
              this.lastLog = log
            }

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('throws without a subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('cy.its("wat")')
            expect(err.message).to.include('child command before running a parent command')

            done()
          })

          cy.its('wat')
        })

        it('throws when property does not exist', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `foo` does not exist on your subject.')
            expect(err.message).to.include('`cy.its()` waited for the specified property `foo` to exist, but it never did.')
            expect(err.message).to.include('If you do not expect the property `foo` to exist, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: \'bar\' }).its(\'quux\').should(\'not.exist\')`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({}).its('foo')
        })

        it('throws when property is undefined', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `foo` returned a `undefined` value.')
            expect(err.message).to.include('`cy.its()` waited for the specified property `foo` to become accessible, but it never did.')
            expect(err.message).to.include('If you expect the property `foo` to be `undefined`, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: undefined }).its(\'foo\').should(\'be.undefined\')`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ foo: undefined }).its('foo')
        })

        it('throws when property is null', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `foo` returned a `null` value.')
            expect(err.message).to.include('`cy.its()` waited for the specified property `foo` to become accessible, but it never did.')
            expect(err.message).to.include('If you expect the property `foo` to be `null`, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: null }).its(\'foo\').should(\'be.null\')`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ foo: null }).its('foo')
        })

        it('throws the traversalErr as precedence when property does not exist even if the additional assertions fail', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `b` does not exist on your subject.')
            expect(err.message).to.include('`cy.its()` waited for the specified property `b` to exist, but it never did.')
            expect(err.message).to.include('If you do not expect the property `b` to exist, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: \'bar\' }).its(\'quux\').should(\'not.exist\')`')

            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ a: 'a' }).its('b').should('be.true')
        })

        it('throws the traversalErr as precedence when property value is undefined even if the additional assertions fail', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `a` returned a `undefined` value.')
            expect(err.message).to.include('`cy.its()` waited for the specified property `a` to become accessible, but it never did.')
            expect(err.message).to.include('If you expect the property `a` to be `undefined`, then add an assertion such as:')
            expect(err.message).to.include('`cy.wrap({ foo: undefined }).its(\'foo\').should(\'be.undefined\')`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ a: undefined }).its('a').should('be.true')
        })

        it('does not display parenthesis on command', function (done) {
          const obj = {
            foo: {
              bar () {},
            },
          }

          obj.foo.bar.baz = () => 'baz'

          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(lastLog.get('error').message).to.include(err.message)
            expect(lastLog.invoke('consoleProps').Property).to.eq('.foo.bar.baz')

            done()
          })

          cy.wrap(obj).its('foo.bar.baz').should('eq', 'baz')
        })

        it('can handle getter that throws', (done) => {
          const spy = cy.spy((err) => {
            expect(err.message).to.eq('Timed out retrying: some getter error')

            done()
          }).as('onFail')

          cy.on('fail', spy)

          const obj = {}

          Object.defineProperty(obj, 'foo', {
            get () {
              throw new Error('some getter error')
            },
          })

          cy.wrap(obj).its('foo')
        })

        it('throws when reduced property does not exist on the subject', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: `cy.its()` errored because the property: `baz` does not exist on your subject.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          const obj = {
            foo: {
              bar: {},
            },
          }

          cy.wrap(obj).its('foo.bar.baz.fizz')
        });

        [null, undefined].forEach((val) => {
          it(`throws on traversed '${val}' subject`, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.include(`Timed out retrying: \`cy.its()\` errored because the property: \`a\` returned a \`${val}\` value. The property: \`b\` does not exist on a \`${val}\` value.`)
              expect(err.message).to.include('`cy.its()` waited for the specified property `b` to become accessible, but it never did.')
              expect(err.message).to.include('If you do not expect the property `b` to exist, then add an assertion such as:')
              expect(err.message).to.include(`\`cy.wrap({ foo: ${val} }).its('foo.baz').should('not.exist')\``)
              expect(err.docsUrl).to.eq('https://on.cypress.io/its')

              done()
            })

            cy.wrap({ a: val }).its('a.b.c')
          })

          it(`throws on initial '${val}' subject`, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.include(`Timed out retrying: \`cy.its()\` errored because your subject is: \`${val}\`. You cannot access any properties such as \`foo\` on a \`${val}\` value.`)
              expect(err.message).to.include(`If you expect your subject to be \`${val}\`, then add an assertion such as:`)
              expect(err.message).to.include(`\`cy.wrap(${val}).should('be.${val}')\``)
              expect(err.docsUrl).to.eq('https://on.cypress.io/its')

              done()
            })

            cy.wrap(val).its('foo')
          })
        })

        it('throws does not accept additional arguments', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('`cy.its()` does not accept additional arguments.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/its')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          const fn = () => 'fn'

          fn.bar = () => 'bar'
          fn.bar.baz = 'baz'

          cy.wrap(fn).its('bar', { log: false }, 'baz').should('eq', 'baz')
        })

        it('throws when options argument is not an object', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('`cy.its()` only accepts an object as the options argument.')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ foo: 'string' }).its('foo', 'bar')
        })

        it('throws when property name is missing', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('`cy.its()` expects the propertyName argument to have a value')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ foo: 'foo' }).its()
        })

        it('throws when property name is not of type string', function (done) {
          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('`cy.its()` only accepts a string or a number as the propertyName argument.')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.wrap({ foo: 'foo' }).its(true)
        })

        it('resets traversalErr and throws the right assertion', function (done) {
          cy.timeout(200)

          const obj = {}

          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            expect(err.message).to.include('Timed out retrying: expected \'bar\' to equal \'baz\'')
            expect(lastLog.get('error').message).to.include(err.message)

            done()
          })

          cy.on('command:retry', _.after(3, () => {
            obj.foo = {
              bar: 'bar',
            }
          }))

          cy.noop(obj).its('foo.bar').should('eq', 'baz')
        })

        it('consoleProps subject', function (done) {
          cy.on('fail', (err) => {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              Command: 'its',
              Property: '.fizz.buzz',
              Error: `\
CypressError: Timed out retrying: \`cy.its()\` errored because the property: \`fizz\` does not exist on your subject.

\`cy.its()\` waited for the specified property \`fizz\` to exist, but it never did.

If you do not expect the property \`fizz\` to exist, then add an assertion such as:

\`cy.wrap({ foo: 'bar' }).its('quux').should('not.exist')\`\
`,
              Subject: { foo: 'bar' },
              Yielded: undefined,
            })

            done()
          })

          cy.noop({ foo: 'bar' }).its('fizz.buzz')
        })
      })
    })
  })

  describe('without jquery', () => {
    before(() => {
      cy
      .visit('/fixtures/dom.html')
      .then(function (win) {
        this.body = win.document.body.outerHTML
      })
    })

    beforeEach(() => {
      const doc = cy.state('document')

      return $(doc.body).empty().html(this.body)
    })

    context('#each', () => {
      it('invokes callback function with runnable.ctx', () => {
        const ctx = this

        cy.wrap([1]).each(() => {
          expect(ctx === this).to.be.true
        })
      })

      it('can each a single element', () => {
        let count = 0

        cy.get('#dom').each(() => count += 1).then(() => expect(count).to.eq(1))
      })

      it('passes the existing subject downstream without side effects', () => {
        let count = 0

        const $lis = cy.$$('#list li')

        expect($lis).to.have.length(3)

        cy.get('#list li').each(($li, i, arr) => {
          expect(i).to.eq(count)
          count += 1
          expect(arr.length).to.eq(3)

          cy.wrap($li).should('have.class', 'item')
        }).then(($lis) => {
          expect(count).to.eq(3)

          expect($lis).to.have.length(3)
        })
      })

      it('awaits promises returned', () => {
        let count = 0

        const start = new Date()

        cy.get('#list li').each(($li, i, arr) => {
          return new Promise((resolve, reject) => {
            return _.delay(() => {
              count += 1

              return resolve()
            }
            , 20)
          })
        }).then(($lis) => {
          expect(count).to.eq(3)

          expect(new Date() - start).to.be.gt(60)
        })
      })

      it('supports array like structures', () => {
        let count = 0
        const arr = [1, 2, 3]

        cy.wrap(arr).each((num, i, a) => {
          expect(a).to.eq(arr)
          expect(i).to.eq(count)
          count += 1

          expect(num).to.eq(count)
        }).then((a) => expect(a).to.eq(arr))
      })

      it('ends early when returning false', () => {
        const arr = [1, 2, 3]

        // after 2 calls return false
        // to end the loop early
        let fn = _.after(2, () => false)

        fn = cy.spy(fn)

        cy.wrap(arr).each(fn)
        .then((a) => expect(fn).to.be.calledTwice)
      })

      it('works with nested eaches', () => {
        let count = 0

        cy.get('#list li').each(($li, i, arr) => {
          cy.wrap($li).parent().siblings('#asdf').find('li').each(($li2, i2, arr2) => count += 1).then(($lis) => {
            expect($lis.first()).to.have.text('asdf 1')

            expect($lis).to.have.length(3)
          })
        }).then(($lis) => {
          expect($lis).to.have.length(3)
          expect($lis.first()).to.have.text('li 0')

          expect(count).to.eq(9)
        })
      })

      it('can operate on a single element', () => {
        let count = 0

        cy.get('div:first').each(($div) => count += 1).then(() => expect(count).to.eq(1))
      })

      describe('errors', () => {
        beforeEach(() => {
          Cypress.config('defaultCommandTimeout', 50)

          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log

            return (this.logs != null ? this.logs.push(log) : undefined)
          })

          return null
        })

        it('can time out', function (done) {
          cy.on('fail', (err) => {
            // get + each
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.include('`cy.each()` timed out after waiting `50ms`.\n\nYour callback function returned a promise which never resolved.')
            expect(err.docsUrl).to.include('https://on.cypress.io/each')

            done()
          })

          cy.get('ul').each(($ul) => new Promise((resolve) => {}))
        })

        it('throws when not passed a callback function', function (done) {
          const logs = []

          cy.on('log:added', (attrs, log) => logs != null ? logs.push(log) : undefined)

          cy.on('fail', (err) => {
            // get + each
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.include('`cy.each()` must be passed a callback function.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')

            done()
          })

          cy.get('ul').each({})
        })

        it('throws when not passed a number', function (done) {
          cy.on('fail', (err) => {
            // get + each
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.include('`cy.each()` can only operate on an array like subject. Your subject was: `100`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')

            done()
          })

          cy.wrap(100).each(() => {})
        })

        it('throws when not passed an array like structure', function (done) {
          cy.on('fail', (err) => {
            // get + each
            expect(this.logs.length).to.eq(2)
            expect(err.message).to.include('`cy.each()` can only operate on an array like subject. Your subject was: `{}`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/each')

            done()
          })

          cy.wrap({}).each(() => {})
        })
      })
    })
  })
})
