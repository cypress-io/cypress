const {
  _,
} = Cypress

describe('src/cy/commands/agents', () => {
  context('.stub', () => {
    it('synchronously returns stub', () => {
      const stub = cy.stub()

      expect(stub).to.exist

      expect(stub.returns).to.be.a('function')
    })

    describe('.stub()', () => {
      beforeEach(() => {
        this.stub = cy.stub()
      })

      it('proxies sinon stub', () => {
        this.stub()

        expect(this.stub.callCount).to.eq(1)
      })

      it('has sinon stub API', () => {
        this.stub.returns(true)
        const result = this.stub()

        expect(result).to.be.true
      })
    })

    describe('.stub(obj, \'method\')', () => {
      beforeEach(() => {
        this.originalCalled = false
        this.obj = {
          foo: () => {
            this.originalCalled = true
          },
        }

        this.stub = cy.stub(this.obj, 'foo')
      })

      it('proxies sinon stub', () => {
        this.obj.foo()

        expect(this.stub.callCount).to.eq(1)
      })

      it('replaces method', () => {
        this.obj.foo()

        expect(this.originalCalled).to.be.false
      })

      it('can callThrough on constructors', () => {
        cy.stub(window, 'Notification').callThroughWithNew().as('Notification')
        new Notification('Hello')

        cy.get('@Notification').should('have.been.calledWith', 'Hello')
      })
    })

    describe('.stub(obj, \'method\', replacerFn)', () => {
      beforeEach(() => {
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

      it('proxies sinon stub', () => {
        this.obj.foo()

        expect(this.stub.callCount).to.eq(1)
      })

      it('replaces method with replacement', () => {
        this.obj.foo()
        expect(this.originalCalled).to.be.false

        expect(this.replacementCalled).to.be.true
      })

      it('replaces values', () => {
        expect(this.obj.bar).to.eq('baz')
      })
    })

    describe('.resolves', () => {
      beforeEach(() => {
        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo')
      })

      it('has resolves method', () => {
        expect(this.stub.resolves).to.be.a('function')
      })

      it('resolves promise', () => {
        this.stub.resolves('foo')

        return this.obj.foo().then((foo) => expect(foo).to.eq('foo'))
      })

      it('uses Bluebird under the hood', () => {
        const obj = {
          foo () {},
        }

        cy.stub(obj, 'foo').resolves('bar')

        return obj
        .foo()
        .delay(1)
      })
    })

    describe('.rejects', () => {
      beforeEach(() => {
        this.obj = { foo () {} }
        this.stub = cy.stub(this.obj, 'foo')
      })

      it('has rejects method', () => {
        expect(this.stub.rejects).to.be.a('function')
      })

      it('rejects promise', () => {
        const error = new Error()

        this.stub.rejects(error)

        return this.obj.foo()
        .then(() => {
          throw new Error('Should throw error')
        }).catch((err) => expect(err).to.eq(error))
      })
    })

    describe('.withArgs', () => {
      beforeEach(() => {
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

      it('can be aliased', () => {
        this.stubWithArgs.as('withFoo')

        expect(this.logs[1].get('alias')).to.eq('withFoo')
      })

      describe('logging', () => {
        it('creates new log instrument with sub-count', () => {
          expect(this.agentLogs.length).to.eq(2)
          expect(this.agentLogs[1].get('name')).to.eq('stub-1.1')
          this.stub.withArgs('bar')
          expect(this.agentLogs.length).to.eq(3)

          expect(this.agentLogs[2].get('name')).to.eq('stub-1.2')
        })

        describe('on invocation', () => {
          it('only logs once', () => {
            this.obj.foo('foo')

            expect(this.logs.length).to.eq(3)
          })

          it('includes count in name', () => {
            this.obj.foo('foo')

            expect(this.logs[2].get('name')).to.eq('stub-1')
          })

          it('has no alias if no aliases set', () => {
            this.obj.foo('foo')

            expect(this.logs[2].get('alias')).to.be.undefined
          })

          it('has withArgs alias if it\'s the only one set', () => {
            this.stubWithArgs.as('withFoo')
            this.obj.foo('foo')

            expect(this.logs[2].get('alias')).to.eql(['withFoo'])
          })

          it('has parent alias if it\'s the only one set', () => {
            this.stub.as('noArgs')
            this.obj.foo('foo')

            expect(this.logs[2].get('alias')).to.eql(['noArgs'])
          })

          it('has both aliases if both set', () => {
            this.stub.as('noArgs')
            this.stubWithArgs.as('withFoo')
            this.obj.foo('foo')

            expect(this.logs[2].get('alias')).to.eql(['noArgs', 'withFoo'])
          })

          it('logs parent if invoked without necessary args', () => {
            this.obj.foo()

            expect(this.logs[2].get('name')).to.eq('stub-1')
          })

          describe('.consoleProps', () => {
            beforeEach(() => {
              this.stub.as('objFoo')
              this.stubWithArgs.as('withFoo')
              this.stub.withArgs('foo', 'baz').as('withFooBaz')
              this.obj.foo('foo')
              this.obj.foo('foo', 'baz')
              this.consoleProps = this.logs[4].get('consoleProps')()
            })

            it('includes the event', () => {
              expect(this.consoleProps['Event']).to.eq('stub-1 called')
            })

            it('includes reference to stub', () => {
              expect(this.consoleProps['stub']).to.be.a('function')
            })

            it('includes call number', () => {
              expect(this.consoleProps['Call #']).to.eq(2)
            })

            it('includes alias', () => {
              expect(this.consoleProps['Alias']).to.eq('objFoo')
            })

            it('includes references to withArgs stubs', () => {
              expect(this.consoleProps['  1.1 stub']).to.be.a('function')

              expect(this.consoleProps['  1.2 stub']).to.be.a('function')
            })

            it('includes withArgs call numbers', () => {
              expect(this.consoleProps['  1.1 call #']).to.eq(2)

              expect(this.consoleProps['  1.2 call #']).to.eq(1)
            })

            it('includes withArgs aliases', () => {
              expect(this.consoleProps['  1.1 alias']).to.eq('withFoo')

              expect(this.consoleProps['  1.2 alias']).to.eq('withFooBaz')
            })

            it('includes withArgs matching arguments', () => {
              expect(this.consoleProps['  1.1 matching arguments']).to.eql(['foo'])

              expect(this.consoleProps['  1.2 matching arguments']).to.eql(['foo', 'baz'])
            })
          })
        })
      })
    })

    describe('.as', () => {
      context('without dots', () => {
        beforeEach(() => {
          this.logs = []
          cy.on('log:added', (attrs, log) => {
            return this.logs.push(log)
          })

          this.stub = cy.stub().as('myStub')
        })

        it('returns stub', () => {
          expect(this.stub).to.have.property('callCount')
        })

        it('updates instrument log with alias', () => {
          expect(this.logs[0].get('alias')).to.eq('myStub')

          expect(this.logs[0].get('aliasType')).to.eq('agent')
        })

        it('includes alias in invocation log', () => {
          this.stub()
          expect(this.logs[1].get('alias')).to.eql(['myStub'])

          expect(this.logs[1].get('aliasType')).to.eq('agent')
        })

        it('includes alias in console props', () => {
          this.stub()
          const consoleProps = this.logs[1].get('consoleProps')()

          expect(consoleProps['Alias']).to.eql('myStub')
        })

        it('updates the displayName of the agent', () => {
          expect(this.myStub.displayName).to.eq('myStub')
        })

        it('stores the lookup as an alias', () => expect(cy.state('aliases').myStub).to.exist)

        it('stores the agent as the subject', () => {
          expect(cy.state('aliases').myStub.subject).to.eq(this.stub)
        })

        it('assigns subject to runnable ctx', () => {
          expect(this.myStub).to.eq(this.stub)
        })

        it('retries until assertions pass', () => {
          cy.on('command:retry', _.after(2, () => {
            return this.myStub('foo')
          }))

          cy.get('@myStub').should('be.calledWith', 'foo')
        })

        describe('errors', () => {
          _.each([null, undefined, {}, [], 123], (value) => {
            it(`throws when passed: ${value}`, () => expect(() => cy.stub().as(value)).to.throw('`cy.as()` can only accept a string.'))
          })

          it('throws on blank string', () => expect(() => cy.stub().as('')).to.throw('`cy.as()` cannot be passed an empty string.'))

          return _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (blacklist) => it(`throws on a blacklisted word: ${blacklist}`, () => expect(() => cy.stub().as(blacklist)).to.throw(`\`cy.as()\` cannot be aliased as: \`${blacklist}\`. This word is reserved.`)))
        })
      })

      context('with dots', () => {
        beforeEach(() => {
          this.logs = []
          cy.on('log:added', (attrs, log) => {
            return this.logs.push(log)
          })

          this.stub = cy.stub().as('my.stub')
        })

        it('returns stub', () => {
          expect(this.stub).to.have.property('callCount')
        })

        it('updates instrument log with alias', () => {
          expect(this.logs[0].get('alias')).to.eq('my.stub')

          expect(this.logs[0].get('aliasType')).to.eq('agent')
        })

        it('includes alias in invocation log', () => {
          this.stub()
          expect(this.logs[1].get('alias')).to.eql(['my.stub'])

          expect(this.logs[1].get('aliasType')).to.eq('agent')
        })

        it('includes alias in console props', () => {
          this.stub()
          const consoleProps = this.logs[1].get('consoleProps')()

          expect(consoleProps['Alias']).to.eql('my.stub')
        })

        it('updates the displayName of the agent', () => {
          expect(this['my.stub'].displayName).to.eq('my.stub')
        })

        it('stores the lookup as an alias', () => expect(cy.state('aliases')['my.stub']).to.exist)

        it('stores the agent as the subject', () => {
          expect(cy.state('aliases')['my.stub'].subject).to.eq(this.stub)
        })

        it('assigns subject to runnable ctx', () => {
          expect(this['my.stub']).to.eq(this.stub)
        })

        it('retries until assertions pass', () => {
          cy.on('command:retry', _.after(2, () => {
            return this['my.stub']('foo')
          }))

          cy.get('@my.stub').should('be.calledWith', 'foo')
        })

        describe('errors', () => {
          _.each([null, undefined, {}, [], 123], (value) => {
            it(`throws when passed: ${value}`, () => expect(() => cy.stub().as(value)).to.throw('`cy.as()` can only accept a string.'))
          })

          it('throws on blank string', () => expect(() => cy.stub().as('')).to.throw('`cy.as()` cannot be passed an empty string.'))

          return _.each(['test', 'runnable', 'timeout', 'slow', 'skip', 'inspect'], (blacklist) => it(`throws on a blacklisted word: ${blacklist}`, () => expect(() => cy.stub().as(blacklist)).to.throw(`\`cy.as()\` cannot be aliased as: \`${blacklist}\`. This word is reserved.`)))
        })
      })
    })

    describe('logging', () => {
      beforeEach(() => {
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

      it('logs agent on creation', () => {
        expect(this.agentLogs[0].get('name')).to.eq('stub-1')
        expect(this.agentLogs[0].get('type')).to.eq('stub-1')

        expect(this.agentLogs[0].get('instrument')).to.eq('agent')
      })

      it('logs event for each invocation', () => {
        this.obj.foo('foo')
        expect(this.stubLogs.length).to.eq(1)
        expect(this.stubLogs[0].get('name')).to.eq('stub-1')
        expect(this.stubLogs[0].get('message')).to.eq('foo("foo")')
        expect(this.stubLogs[0].get('event')).to.be.true

        this.obj.foo('bar')
        expect(this.stubLogs.length).to.eq(2)
        expect(this.stubLogs[1].get('name')).to.eq('stub-1')
        expect(this.stubLogs[1].get('message')).to.eq('foo("bar")')

        expect(this.stubLogs[1].get('event')).to.be.true
      })

      it('increments callCount of agent log on each invocation', () => {
        expect(this.agentLogs[0].get('callCount')).to.eq(0)
        this.obj.foo('foo', 'bar')
        expect(this.agentLogs[0].get('callCount')).to.eq(1)
        this.obj.foo('foo', 'baz')

        expect(this.agentLogs[0].get('callCount')).to.eq(2)
      })

      it('resets unique name counter on restore', () => {
        expect(this.agentLogs[0].get('name')).to.eq('stub-1')

        Cypress.emit('test:before:run', {})

        cy.stub()

        expect(this.agentLogs[1].get('name')).to.eq('stub-1')
      })

      context('arg formatting', () => {
        beforeEach(() => {
          this.bigArray = [1, 2, 3, 4, 5]
          this.bigObject = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 }

          this.obj.foo('str', 5, true)
          this.obj.foo(null, undefined, [1, 2, 3])
          this.obj.foo({ g: 1 }, this.bigArray, this.bigObject)

          return this.obj.foo(1, 2, 3, 4, 5)
        })

        context('in message', () => {
          it('formats args', () => {
            expect(this.logs[1].get('message')).to.eq('foo("str", 5, true)')
            expect(this.logs[2].get('message')).to.eq('foo(null, undefined, [1, 2, 3])')

            expect(this.logs[3].get('message')).to.eq('foo({g: 1}, Array[5], Object{6})')
          })

          it('truncates if more than 3 args', () => {
            expect(this.logs[4].get('message')).to.eq('foo(1, 2, 3, ...)')
          })
        })

        context('in assertion', () => {
          beforeEach(() => {
            cy.on('log:added', (attrs, log) => {
              this.lastLog = log
            })

            return null
          })

          it('formats string, number, boolean args', () => {
            expect(this.obj.foo).be.calledWith('str', 5, true)

            expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments "str", 5, true')
          })

          it('formats null, undefined, small array args', () => {
            expect(this.obj.foo).be.calledWith(null, undefined, [1, 2, 3])

            expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments null, undefined, [1, 2, 3]')
          })

          it('formats small object, big array, big object args', () => {
            expect(this.obj.foo).be.calledWith({ g: 1 }, this.bigArray, this.bigObject)

            expect(this.lastLog.get('message')).to.include('expected foo to have been called with arguments {g: 1}, Array[5], Object{6}')
          })

          it('does not include stack with calls when assertion fails', function (done) {
            cy.on('fail', () => {
              expect(this.lastLog.get('message')).to.include(`\
${'    '}foo("str", 5, true) => "return value"
${'    '}foo(null, undefined, [1, 2, 3]) => "return value"
${'    '}foo({g: 1}, Array[5], Object{6}) => "return value"
${'    '}foo(1, 2, 3, 4, 5) => "return value"\
`)

              done()
            })

            cy.wrap(null).then(() => {
              expect(this.obj.foo).to.be.calledWith(false, false, false)
            })
          })
        })
      })

      context('#consoleProps', () => {
        beforeEach(() => {
          this.stub.as('objFoo')
          this.context = {}
          this.obj.foo.call(this.context, 'foo', 'baz')
          this.obj.foo('foo', 'baz')
          this.consoleProps = this.logs[1].get('consoleProps')()
        })

        it('does not include \'command\' or \'error\' properties', () => {
          expect(this.consoleProps['Command']).to.be.null

          expect(this.consoleProps['Error']).to.be.null
        })

        it('includes the event', () => {
          expect(this.consoleProps['Event']).to.eq('stub-1 called')
        })

        it('includes reference to stub', () => {
          expect(this.consoleProps['stub']).to.be.a('function')
        })

        it('includes call number', () => {
          expect(this.consoleProps['Call #']).to.eq(2)
        })

        it('includes alias', () => {
          expect(this.consoleProps['Alias']).to.eq('objFoo')
        })

        it('includes references to stubbed object', () => {
          expect(this.consoleProps['Stubbed Obj']).to.be.eq(this.obj)
        })

        it('includes arguments', () => {
          expect(this.consoleProps['Arguments']).to.eql(['foo', 'baz'])
        })

        it('includes context', () => {
          expect(this.consoleProps['Context']).to.eq(this.context)
        })

        it('includes return value', () => {
          expect(this.consoleProps['Returned']).to.eq('return value')
        })
      })
    })
  })

  context('.spy(obj, \'method\')', () => {
    beforeEach(() => {
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

    it('synchronously returns spy', () => {
      expect(this.spy).to.exist

      expect(this.spy.callCount).to.be.a('number')
    })

    it('proxies sinon spy', () => {
      this.obj.foo()

      expect(this.spy.callCount).to.eq(1)
    })

    it('does not replace method', () => {
      this.obj.foo()

      expect(this.originalCalled).to.be.true
    })

    it('can spy on constructors', () => {
      cy.spy(window, 'Notification').as('Notification')
      new Notification('Hello')

      cy.get('@Notification').should('have.been.calledWith', 'Hello')
    })

    context('#as', () => {
      // same as cy.stub(), so just some smoke tests here
      beforeEach(() => {
        this.logs = []
        cy.on('log:added', (attrs, log) => {
          return this.logs.push(log)
        })

        this.spy = cy.spy().as('mySpy')
      })

      it('returns spy', () => {
        expect(this.spy).to.have.property('callCount')
      })

      it('updates instrument log with alias', () => {
        expect(this.logs[0].get('alias')).to.eq('mySpy')

        expect(this.logs[0].get('aliasType')).to.eq('agent')
      })
    })

    context('logging', () => {
      // same as cy.stub() except for name and type
      it('logs agent on creation', () => {
        expect(this.logs[0].get('name')).to.eq('spy-1')
        expect(this.logs[0].get('type')).to.eq('spy-1')

        expect(this.logs[0].get('instrument')).to.eq('agent')
      })

      context('#consoleProps', () => {
        beforeEach(() => {
          this.obj.foo()
          this.consoleProps = this.logs[1].get('consoleProps')()
        })

        it('includes reference to spy', () => {
          expect(this.consoleProps['spy']).to.be.a('function')
        })

        it('includes references to spied object', () => {
          expect(this.consoleProps['Spied Obj']).to.be.eq(this.obj)
        })
      })
    })
  })

  context('.agents', () => {
    beforeEach(() => {
      cy.spy(top.console, 'warn')
      this.agents = cy.agents()
    })

    it('logs deprecation warning', () => expect(top.console.warn).to.be.calledWith('Cypress Warning: `cy.agents()` is deprecated. Use `cy.stub()` and `cy.spy()` instead.'))

    it('synchronously returns #spy and #stub methods', () => {
      expect(this.agents.spy).to.be.a('function')
      expect(this.agents.spy().callCount).to.be.a('number')
      expect(this.agents.stub).to.be.a('function')

      expect(this.agents.stub().returns).to.be.a('function')
    })
  })
})
