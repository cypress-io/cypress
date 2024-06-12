require('../spec_helper')

const Reporter = require(`../../lib/reporter`)
const snapshot = require('snap-shot-it')

describe('lib/reporter', () => {
  beforeEach(function () {
    this.reporter = new Reporter()

    this.root = {
      id: 'r1',
      root: true,
      title: '',
      tests: [],
      suites: [
        {
          id: 'r2',
          title: 'TodoMVC - React',
          tests: [],
          suites: [
            {
              id: 'r3',
              title: 'When page is initially opened',
              tests: [
                {
                  id: 'r4',
                  title: 'should focus on the todo input field',
                  duration: 4,
                  state: 'failed',
                  timedOut: false,
                  async: 0,
                  sync: true,
                  err: {
                    message: 'foo',
                    stack: 'at foo:1:1\nat bar:1:1\nat baz:1:1',
                    codeFrame: {
                      line: 7,
                      column: 8,
                      originalFile: 'cypress/integration/spec.js',
                      relativeFile: 'cypress/integration/spec.js',
                      absoluteFile: '/path/to/cypress/integration/spec.js',
                      frame: '   5 | \n   6 |   it(\'fails\', () => {\n>  7 |     cy.get(\'nope\', { timeout: 1 })\n     |        ^\n   8 |   })\n   9 | })\n  10 | ',
                      language: 'js',
                    },
                  },
                },
                {
                  id: 'r5',
                  title: 'does something good',
                  duration: 4,
                  state: 'pending',
                  timedOut: false,
                  async: 0,
                  sync: true,
                },
              ],
              suites: [],
            },
          ],
        },
      ],
    }

    this.testObj = this.root.suites[0].suites[0].tests[0]

    return this.reporter.setRunnables(this.root)
  })

  context('.create', () => {
    it('can create mocha-teamcity-reporter', function () {
      const teamCityFn = sinon.stub()

      mockery.registerMock('mocha-teamcity-reporter', teamCityFn)

      const reporter = Reporter.create('teamcity')

      reporter.setRunnables(this.root)

      expect(reporter.reporterName).to.eq('teamcity')

      expect(teamCityFn).to.be.calledWith(reporter.runner)
    })

    it('can create mocha-junit-reporter', function () {
      const junitFn = sinon.stub()

      mockery.registerMock('mocha-junit-reporter', junitFn)

      const reporter = Reporter.create('junit')

      reporter.setRunnables(this.root)

      expect(reporter.reporterName).to.eq('junit')

      expect(junitFn).to.be.calledWith(reporter.runner)
    })
  })

  context('createSuite', () => {
    beforeEach(function () {
      this.errorObj = {
        message: 'expected true to be false',
        name: 'AssertionError',
        stack: 'AssertionError: expected true to be false',
        actual: true,
        expected: false,
        showDiff: false,
      }
    })

    it('recursively creates suites for fullTitle', function () {
      const args = this.reporter.parseArgs('fail', this.testObj)

      expect(args[0]).to.eq('fail')

      const title = 'TodoMVC - React When page is initially opened should focus on the todo input field'

      expect(args[1].fullTitle()).to.eq(title)
    })
  })

  context('#stats', () => {
    it('has reporterName stats, reporterStats, etc', function () {
      sinon.stub(Date, 'now').returns(1234)

      this.reporter.emit('test', this.testObj)
      this.reporter.emit('fail', this.testObj)
      this.reporter.emit('test end', this.testObj)

      this.reporter.reporterName = 'foo'

      return snapshot(this.reporter.results())
    })
  })

  context('#emit', () => {
    beforeEach(function () {
      this.emit = sinon.spy(this.reporter.runner, 'emit')
    })

    it('emits start', function () {
      this.reporter.emit('start', {})
      expect(this.emit).to.be.calledWith('start')

      expect(this.emit).to.be.calledOn(this.reporter.runner)
    })

    it('emits test with updated properties', function () {
      this.reporter.emit('test', { id: 'r5', state: 'passed' })
      expect(this.emit).to.be.calledWith('test')
      expect(this.emit.getCall(0).args[1].title).to.eq('does something good')

      expect(this.emit.getCall(0).args[1].state).to.eq('passed')
    })

    it('ignores events not in the events table', function () {
      this.reporter.emit('foo')

      expect(this.emit).not.to.be.called
    })

    it('sends suites with updated properties and nested subtree', function () {
      this.reporter.emit('suite', { id: 'r3', state: 'passed' })
      expect(this.emit).to.be.calledWith('suite')
      expect(this.emit.getCall(0).args[1].state).to.eq('passed')

      expect(this.emit.getCall(0).args[1].tests.length).to.equal(2)
    })
  })

  context('#normalizeTest', () => {
    let reporter
    let test

    beforeEach(() => {
      reporter = new Reporter()
      test = {
        prevAttempts: [
          {
            err: {
              name: 'Error',
              message: 'There was an error',
            },
          },
        ],
      }
    })

    // https://github.com/cypress-io/cypress/issues/17378
    describe('attempt errors', () => {
      it('is null when error is undefined', () => {
        test.prevAttempts[0].err = undefined
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error).to.be.null
      })

      it('stack is undefined when error is a string', () => {
        test.prevAttempts[0].err = 'There was an error'
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).to.be.undefined
      })

      it('stack is undefined when undefined', () => {
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).to.be.undefined
      })

      it('stack is an empty string when an empty string', () => {
        test.prevAttempts[0].err.stack = ''
        const result = reporter.normalizeTest(test)

        expect(result.attempts[0].error.stack).to.equal('')
      })
    })
  })
})
