// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _,
} = Cypress

describe('src/cy/commands/agents', function () {
  context('.stub', function () {
    it('synchronously returns stub', () => {
      const stub = cy.stub()

      expect(stub).to.exist

      return expect(stub.returns).to.be.a('function')
    })

    describe('.stub()', function () {
      beforeEach(function () {
        this.stub = cy.stub()
      })

      it('proxies sinon stub', function () {
        this.stub()

        return expect(this.stub.callCount).to.eq(1)
      })

      return it('has sinon stub API', function () {
        this.stub.returns(true)
        const result = this.stub()

        return expect(result).to.be.true
      })
    })

    describe('.stub(obj, \'method\')', function () {
      beforeEach(function () {
        this.originalCalled = false
        this.obj = {
          foo: () => {
            this.originalCalled = true
          },
        }

        this.stub = cy.stub(this.obj, 'foo')
      })

      it('proxies sinon stub', function () {
        this.obj.foo()

        return expect(this.stub.callCount).to.eq(1)
      })

      it('replaces method', function () {
        this.obj.foo()

        return expect(this.originalCalled).to.be.false
      })

      return it('can callThrough on constructors', () => {
        cy.stub(window, 'Notification').callThroughWithNew().as('Notification')
        new Notification('Hello')

        return cy.get('@Notification').should('have.been.calledWith', 'Hello')
      })
    })

    describe('.stub(obj, \'method\', replacerFn)', function () {
      beforeEach(function () {
        this.originalCalled = false
        this.obj = {
          bar: 'bar',
          foo: () => {
            this.originalCalled = true
          },
        }

        cy.stub(this.obj, 'bar', 'baz')

        this.replacementCalled = false

        this.stub = cy.stub(this.obj, 'foo', () => {
          this.replacementCalled = true
        })
      })

      it('proxies sinon stub', function () {
        this.obj.foo()

        return expect(this.stub.callCount).to.eq(1)
      })

      it('replaces method with replacement', function () {
        this.obj.foo()
        expect(this.originalCalled).to.be.false

        return expect(this.replacementCalled).to.be.true
      })

      return it('replaces values', function () {
        return expect(this.obj.bar).to.eq('baz')
      })
    })

    describe('.resolves', function () {
      beforeEach(function () {
        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo')
      })

      it('has resolves method', function () {
        return expect(this.stub.resolves).to.be.a('function')
      })

      it('resolves promise', function () {
        this.stub.resolves('foo')

        return this.obj.foo().then((foo) => expect(foo).to.eq('foo'))
      })

      return it('uses Bluebird under the hood', () => {
        const obj = {
          foo () {},
        }

        cy.stub(obj, 'foo').resolves('bar')

        return obj
        .foo()
        .delay(1)
      })
    })

    describe('.rejects', function () {
      beforeEach(function () {
        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo')
      })

      it('has rejects method', function () {
        return expect(this.stub.rejects).to.be.a('function')
      })

      return it('rejects promise', function () {
        const error = new Error()

        this.stub.rejects(error)

        return this.obj.foo()
        .then(() => {
          throw new Error('Should throw error')
        }).catch((err) => expect(err).to.eq(error))
      })
    })

    describe('.withArgs', function () {
      beforeEach(function () {
        this.agentLogs = []
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.instrument === 'agent') {
            this.agentLogs.push(log)
          }

          return this.logs.push(log)
        })

        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo')
        this.stubWithArgs = this.stub.withArgs('foo')
      })

      it('can be aliased', function () {
        this.stubWithArgs.as('withFoo')

        return expect(this.logs[1].get('alias')).to.eq('withFoo')
      })

      return describe('logging', function () {
        it('creates new log instrument with sub-count', function () {
          expect(this.agentLogs.length).to.eq(2)
          expect(this.agentLogs[1].get('name')).to.eq('stub-1.1')
          this.stub.withArgs('bar')
          expect(this.agentLogs.length).to.eq(3)

          return expect(this.agentLogs[2].get('name')).to.eq('stub-1.2')
        })

        return describe('on invocation', function () {
          it('only logs once', function () {
            this.obj.foo('foo')

            return expect(this.logs.length).to.eq(3)
          })

          it('includes count in name', function () {
            this.obj.foo('foo')

            return expect(this.logs[2].get('name')).to.eq('stub-1')
          })

          it('has no alias if no aliases set', function () {
            this.obj.foo('foo')

            return expect(this.logs[2].get('alias')).to.be.undefined
          })

          it('has withArgs alias if it\'s the only one set', function () {
            this.stubWithArgs.as('withFoo')
            this.obj.foo('foo')

            return expect(this.logs[2].get('alias')).to.eql(['withFoo'])
          })

          it('has parent alias if it\'s the only one set', function () {
            this.stub.as('noArgs')
            this.obj.foo('foo')

            return expect(this.logs[2].get('alias')).to.eql(['noArgs'])
          })

          it('has both aliases if both set', function () {
            this.stub.as('noArgs')
            this.stubWithArgs.as('withFoo')
            this.obj.foo('foo')

            return expect(this.logs[2].get('alias')).to.eql(['noArgs', 'withFoo'])
          })

          it('logs parent if invoked without necessary args', function () {
            this.obj.foo()

            return expect(this.logs[2].get('name')).to.eq('stub-1')
          })

          return describe('.consoleProps', function () {
            beforeEach(function () {
              this.stub.as('objFoo')
              this.stubWithArgs.as('withFoo')
              this.stub.withArgs('foo', 'baz').as('withFooBaz')
              this.obj.foo('foo')
              this.obj.foo('foo', 'baz')
              this.consoleProps = this.logs[4].get('consoleProps')()
            })

            it('includes the event', function () {
              return expect(this.consoleProps['Event']).to.eq('stub-1 called')
            })

            it('includes reference to stub', function () {
              return expect(this.consoleProps['stub']).to.be.a('function')
            })

            it('includes call number', function () {
              return expect(this.consoleProps['Call #']).to.eq(2)
            })

            it('includes alias', function () {
              return expect(this.consoleProps['Alias']).to.eq('objFoo')
            })

            it('includes references to withArgs stubs', function () {
              expect(this.consoleProps['  1.1 stub']).to.be.a('function')

              return expect(this.consoleProps['  1.2 stub']).to.be.a('function')
            })

            it('includes withArgs call numbers', function () {
              expect(this.consoleProps['  1.1 call #']).to.eq(2)

              return expect(this.consoleProps['  1.2 call #']).to.eq(1)
            })

            it('includes withArgs aliases', function () {
              expect(this.consoleProps['  1.1 alias']).to.eq('withFoo')

              return expect(this.consoleProps['  1.2 alias']).to.eq('withFooBaz')
            })

            return it('includes withArgs matching arguments', function () {
              expect(this.consoleProps['  1.1 matching arguments']).to.eql(['foo'])

              return expect(this.consoleProps['  1.2 matching arguments']).to.eql(['foo', 'baz'])
            })
          })
        })
      })
    })

    describe('.as', function () {
      context('without dots', function () {
        beforeEach(function () {
          this.logs = []
          cy.on('log:added', (attrs, log) => {
            return this.logs.push(log)
          })

          this.stub = cy.stub().as('myStub')
        })

        it('returns stub', function () {
          return expect(this.stub).to.have.property('callCount')
        })

        it('updates instrument log with alias', function () {
          expect(this.logs[0].get('alias')).to.eq('myStub')

          return expect(this.logs[0].get('aliasType')).to.eq('agent')
        })

        it('includes alias in invocation log', function () {
          this.stub()
          expect(this.logs[1].get('alias')).to.eql(['myStub'])

          return expect(this.logs[1].get('aliasType')).to.eq('agent')
        })

        it('includes alias in console props', function () {
          this.stub()
          const consoleProps = this.logs[1].get('consoleProps')()

          return expect(consoleProps['Alias']).to.eql('myStub')
        })

        it('updates the displayName of the agent', function () {
          return expect(this.myStub.displayName).to.eq('myStub')
        })

        it('stores the lookup as an alias', () => expect(cy.state('aliases').myStub).to.exist)

        it('stores the agent as the subject', function () {
          return expect(cy.state('aliases').myStub.subject).to.eq(this.stub)
        })

        it('assigns subject to runnable ctx', function () {
          return expect(this.myStub).to.eq(this.stub)
        })

        it('retries until assertions pass', function () {
          cy.on('command:retry', _.after(2, () => {
            return this.myStub('foo')
          }))

          return cy.get('@myStub').should('be.calledWith', 'foo')
        })

        return describe('errors', () => {
          _.each([null, undefined, {}, [], 123], (value) => {
            return it(`throws when passed: ${value}`, () => expect(() => cy.stub().as(value)).to.throw('`cy.as()` can only accept a string.'))
          })

          it('throws on blank string', () => expect(() => cy.stub().as('')).to.throw('`cy.as()` cannot be passed an empty string.'))

          return _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (blacklist) => it(`throws on a blacklisted word: ${blacklist}`, () => expect(() => cy.stub().as(blacklist)).to.throw(`\`cy.as()\` cannot be aliased as: \`${blacklist}\`. This word is reserved.`)))
        })
      })

      return context('with dots', function () {
        beforeEach(function () {
          this.logs = []
          cy.on('log:added', (attrs, log) => {
            return this.logs.push(log)
          })

          this.stub = cy.stub().as('my.stub')
        })

        it('returns stub', function () {
          return expect(this.stub).to.have.property('callCount')
        })

        it('updates instrument log with alias', function () {
          expect(this.logs[0].get('alias')).to.eq('my.stub')

          return expect(this.logs[0].get('aliasType')).to.eq('agent')
        })

        it('includes alias in invocation log', function () {
          this.stub()
          expect(this.logs[1].get('alias')).to.eql(['my.stub'])

          return expect(this.logs[1].get('aliasType')).to.eq('agent')
        })

        it('includes alias in console props', function () {
          this.stub()
          const consoleProps = this.logs[1].get('consoleProps')()

          return expect(consoleProps['Alias']).to.eql('my.stub')
        })

        it('updates the displayName of the agent', function () {
          return expect(this['my.stub'].displayName).to.eq('my.stub')
        })

        it('stores the lookup as an alias', () => expect(cy.state('aliases')['my.stub']).to.exist)

        it('stores the agent as the subject', function () {
          return expect(cy.state('aliases')['my.stub'].subject).to.eq(this.stub)
        })

        it('assigns subject to runnable ctx', function () {
          return expect(this['my.stub']).to.eq(this.stub)
        })

        it('retries until assertions pass', function () {
          cy.on('command:retry', _.after(2, () => {
            return this['my.stub']('foo')
          }))

          return cy.get('@my.stub').should('be.calledWith', 'foo')
        })

        return describe('errors', () => {
          _.each([null, undefined, {}, [], 123], (value) => {
            return it(`throws when passed: ${value}`, () => expect(() => cy.stub().as(value)).to.throw('`cy.as()` can only accept a string.'))
          })

          it('throws on blank string', () => expect(() => cy.stub().as('')).to.throw('`cy.as()` cannot be passed an empty string.'))

          return _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (blacklist) => it(`throws on a blacklisted word: ${blacklist}`, () => expect(() => cy.stub().as(blacklist)).to.throw(`\`cy.as()\` cannot be aliased as: \`${blacklist}\`. This word is reserved.`)))
        })
      })
    })

    return describe('logging', function () {
      beforeEach(function () {
        this.logs = []
        this.agentLogs = []
        this.stubLogs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.instrument === 'agent') {
            this.agentLogs.push(log)
          }

          if (attrs.event) {
            this.stubLogs.push(log)
          }

          return this.logs.push(log)
        })

        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo').returns('return value')
      })

      it('logs agent on creation', function () {
        expect(this.agentLogs[0].get('name')).to.eq('stub-1')
        expect(this.agentLogs[0].get('type')).to.eq('stub-1')

        return expect(this.agentLogs[0].get('instrument')).to.eq('agent')
      })

      it('logs event for each invocation', function () {
        this.obj.foo('foo')
        expect(this.stubLogs.length).to.eq(1)
        expect(this.stubLogs[0].get('name')).to.eq('stub-1')
        expect(this.stubLogs[0].get('message')).to.eq('foo("foo")')
        expect(this.stubLogs[0].get('event')).to.be.true

        this.obj.foo('bar')
        expect(this.stubLogs.length).to.eq(2)
        expect(this.stubLogs[1].get('name')).to.eq('stub-1')
        expect(this.stubLogs[1].get('message')).to.eq('foo("bar")')

        return expect(this.stubLogs[1].get('event')).to.be.true
      })

      it('increments callCount of agent log on each invocation', function () {
        expect(this.agentLogs[0].get('callCount')).to.eq(0)
        this.obj.foo('foo', 'bar')
        expect(this.agentLogs[0].get('callCount')).to.eq(1)
        this.obj.foo('foo', 'baz')

        return expect(this.agentLogs[0].get('callCount')).to.eq(2)
      })

      it('resets unique name counter on restore', function () {
        expect(this.agentLogs[0].get('name')).to.eq('stub-1')

        Cypress.emit('test:before:run', {})

        cy.stub()

        return expect(this.agentLogs[1].get('name')).to.eq('stub-1')
      })

      context('arg formatting', function () {
        beforeEach(function () {
          this.bigArray = [1, 2, 3, 4, 5]
          this.bigObject = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }

          this.obj.foo('str', 5, true)
          this.obj.foo(null, undefined, [1, 2, 3])
          this.obj.foo({ g: 1 }, this.bigArray, this.bigObject)

          return this.obj.foo(1, 2, 3, 4, 5)
        })

        context('in message', function () {
          it('formats args', function () {
            expect(this.logs[1].get('message')).to.eq('foo("str", 5, true)')
            expect(this.logs[2].get('message')).to.eq('foo(null, undefined, [1, 2, 3])')

            return expect(this.logs[3].get('message')).to.eq('foo({g: 1}, Array[5], Object{6})')
          })

          return it('truncates if more than 3 args', function () {
            return expect(this.logs[4].get('message')).to.eq('foo(1, 2, 3, ...)')
          })
        })

        return context('in assertion', function () {
          beforeEach(function () {
            cy.on('log:added', (attrs, log) => {
              this.lastLog = log
            })

            return null
          })

          it('formats string, number, boolean args', function () {
            expect(this.obj.foo).be.calledWith('str', 5, true)

            return expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments "str", 5, true')
          })

          it('formats null, undefined, small array args', function () {
            expect(this.obj.foo).be.calledWith(null, undefined, [1, 2, 3])

            return expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments null, undefined, [1, 2, 3]')
          })

          it('formats small object, big array, big object args', function () {
            expect(this.obj.foo).be.calledWith({ g: 1 }, this.bigArray, this.bigObject)

            return expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments {g: 1}, Array[5], Object{6}')
          })

          return it('does not include stack with calls when assertion fails', function (done) {
            cy.on('fail', () => {
              expect(this.lastLog.get('message')).to.include(`\
${'    '}foo("str", 5, true) => "return value"
${'    '}foo(null, undefined, [1, 2, 3]) => "return value"
${'    '}foo({g: 1}, Array[5], Object{6}) => "return value"
${'    '}foo(1, 2, 3, 4, 5) => "return value"\
`)

              return done()
            })

            return cy.wrap(null).then(function () {
              return expect(this.obj.foo).to.be.calledWith(false, false, false)
            })
          })
        })
      })

      return context('#consoleProps', function () {
        beforeEach(function () {
          this.stub.as('objFoo')
          this.context = {}
          this.obj.foo.call(this.context, 'foo', 'baz')
          this.obj.foo('foo', 'baz')
          this.consoleProps = this.logs[1].get('consoleProps')()
        })

        it('does not include \'command\' or \'error\' properties', function () {
          expect(this.consoleProps['Command']).to.be.null

          return expect(this.consoleProps['Error']).to.be.null
        })

        it('includes the event', function () {
          return expect(this.consoleProps['Event']).to.eq('stub-1 called')
        })

        it('includes reference to stub', function () {
          return expect(this.consoleProps['stub']).to.be.a('function')
        })

        it('includes call number', function () {
          return expect(this.consoleProps['Call #']).to.eq(2)
        })

        it('includes alias', function () {
          return expect(this.consoleProps['Alias']).to.eq('objFoo')
        })

        it('includes references to stubbed object', function () {
          return expect(this.consoleProps['Stubbed Obj']).to.be.eq(this.obj)
        })

        it('includes arguments', function () {
          return expect(this.consoleProps['Arguments']).to.eql(['foo', 'baz'])
        })

        it('includes context', function () {
          return expect(this.consoleProps['Context']).to.eq(this.context)
        })

        return it('includes return value', function () {
          return expect(this.consoleProps['Returned']).to.eq('return value')
        })
      })
    })
  })

  context('.spy(obj, \'method\')', function () {
    beforeEach(function () {
      this.logs = []
      cy.on('log:added', (attrs, log) => {
        return this.logs.push(log)
      })

      this.originalCalled = false
      this.obj = {
        foo: () => {
          this.originalCalled = true
        },
      }

      this.spy = cy.spy(this.obj, 'foo')
    })

    it('synchronously returns spy', function () {
      expect(this.spy).to.exist

      return expect(this.spy.callCount).to.be.a('number')
    })

    it('proxies sinon spy', function () {
      this.obj.foo()

      return expect(this.spy.callCount).to.eq(1)
    })

    it('does not replace method', function () {
      this.obj.foo()

      return expect(this.originalCalled).to.be.true
    })

    it('can spy on constructors', () => {
      cy.spy(window, 'Notification').as('Notification')
      new Notification('Hello')

      return cy.get('@Notification').should('have.been.calledWith', 'Hello')
    })

    context('#as', function () {
      // same as cy.stub(), so just some smoke tests here
      beforeEach(function () {
        this.logs = []
        cy.on('log:added', (attrs, log) => {
          return this.logs.push(log)
        })

        this.spy = cy.spy().as('mySpy')
      })

      it('returns spy', function () {
        return expect(this.spy).to.have.property('callCount')
      })

      return it('updates instrument log with alias', function () {
        expect(this.logs[0].get('alias')).to.eq('mySpy')

        return expect(this.logs[0].get('aliasType')).to.eq('agent')
      })
    })

    return context('logging', function () {
      // same as cy.stub() except for name and type
      it('logs agent on creation', function () {
        expect(this.logs[0].get('name')).to.eq('spy-1')
        expect(this.logs[0].get('type')).to.eq('spy-1')

        return expect(this.logs[0].get('instrument')).to.eq('agent')
      })

      return context('#consoleProps', function () {
        beforeEach(function () {
          this.obj.foo()
          this.consoleProps = this.logs[1].get('consoleProps')()
        })

        it('includes reference to spy', function () {
          return expect(this.consoleProps['spy']).to.be.a('function')
        })

        return it('includes references to spied object', function () {
          return expect(this.consoleProps['Spied Obj']).to.be.eq(this.obj)
        })
      })
    })
  })

  return context('.agents', function () {
    beforeEach(function () {
      cy.spy(top.console, 'warn')
      this.agents = cy.agents()
    })

    it('logs deprecation warning', () => expect(top.console.warn).to.be.calledWith('Cypress Warning: `cy.agents()` is deprecated. Use `cy.stub()` and `cy.spy()` instead.'))

    return it('synchronously returns #spy and #stub methods', function () {
      expect(this.agents.spy).to.be.a('function')
      expect(this.agents.spy().callCount).to.be.a('number')
      expect(this.agents.stub).to.be.a('function')

      return expect(this.agents.stub().returns).to.be.a('function')
    })
  })
})
