
const { $, _ } = Cypress
const helpers = require('../../support/helpers')
const sinon = require('sinon')
const { match } = sinon
// const m = match
const jestDiff = require('jest-diff')

const backupCy = window.cy
const backupCypress = window.Cypress

backupCy.__original__ = true

const assert = (expr, message) => {
  if (!expr) {
    message = `Assertion Failed: ${message}`
    Cypress.log({
      message,
      state: 'failed',
      name: 'assert',
    })
    throw new Error(message)
  }

  Cypress.log({
    message,
    name: 'assert',
    state: 'passed',
  })
}
let lastActual = 'none'

describe('src/cypress/runner', () => {
  /**
	 * @type {sinon.SinonStub}
	 */
  let allStubs

  before(() => {
    const btn = $('<span><button>COPY</button></span>', window.top.document)
    const container = $('.toggle-auto-scrolling.auto-scrolling-enabled', window.top.document).closest('.controls')

    btn.on('click', () => {
      copyToClipboard(JSON.stringify(lastActual, null, '\t'))
    })

    container.append(btn)
    cy.visit('/fixtures/generic.html')
  })

  beforeEach(function () {
    window.cy = backupCy
    window.Cypress = backupCypress
    backupCypress.mocha.override()
    cy.state('returnedCustomPromise', false)

    const autWindow = cy.state('window')
    // delete top.Cypress

    this.Cypress = Cypress.$Cypress.create(Cypress.config())
    this.Cypress.onSpecWindow(autWindow)
    this.Cypress.initialize($('.aut-iframe', top.document))

    window.cy = backupCy
    window.Cypress = backupCypress

    allStubs = cy.stub().log(false)

    cy.stub(this.Cypress, 'emit').callsFake(allStubs)
    cy.stub(this.Cypress, 'emitMap').callsFake(allStubs)
    cy.stub(this.Cypress, 'emitThen').callsFake((...args) => {
      allStubs(...args)

      return Promise.resolve()
    })

    backupCypress.mocha.override()

    this.runMochaTests = (obj) => {
      this.Cypress.mocha.override()

      helpers.generateMochaTestsForWin(autWindow, obj)

      this.Cypress.normalizeAll()

      return new Cypress.Promise((resolve) => {
        return this.Cypress.run(resolve)
      })
    }

  })

  describe('isolated runner', function () {
    // it('empty', () => {})

    it('simple 1', function () {
      return this.runMochaTests({ suites: { 'suite 1': { tests: [{ name: 'test 1' }] } } })
      .then(shouldHavePassed())
      .then(() => {
        assertMatch(formatEvents(allStubs), [
          ['run:start'],
          [
            'test:before:run',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r3',
              'title': 'test 1',
              'state': 'passed',
            },
          ],
          ['run:end'],
        ])
      })
    })

    it('simple 2', function () {
      return this.runMochaTests({
        suites: {
          'suite 1': { tests: [{ name: 'test 1' }] },
          'suite 2': {
            hooks: ['before'],
            tests: ['test 1'],
          },
        },
      })
      .then(shouldHavePassed())
      .then(() => {

        assertMatch(formatEvents(allStubs), [
          ['run:start'],
          [
            'test:before:run',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r3',
              'title': 'test 1',
              'state': 'passed',
            },
          ],
          [
            'test:before:run',
            {
              'id': 'r5',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r5',
              'title': 'test 1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r5',
              'title': '"before all" hook',
              'hookName': 'before all',
              'hookId': 'h1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r5',
              'title': 'test 1',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r5',
              'title': 'test 1',
              'state': 'passed',
            },
          ],
          ['run:end'],
        ])

      })
    })
    it('simple fail', function () {
      return this.runMochaTests({
        suites: {
          'suite 1': {
            tests: [
              {
                name: 'test 1',
                fail: true,
              },
            ],
          },
        },
      })
      .then(shouldHaveFailed(1))
      .then(() => {

        assertMatch(formatEvents(allStubs), [
          ['run:start'],
          [
            'test:before:run',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          ['fail', {}],
          [
            'runnable:after:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
              'err': '[Object]',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r3',
              'title': 'test 1',
              'err': '[Object]',
              'state': 'failed',
            },
          ],
          ['run:end'],
        ])

      })
    })

    it('pass fail pass fail', function () {
      return this.runMochaTests({
        suites: {
          'suite 1': {
            tests: [
              'test 1',
              {
                name: 'test 2',
                fail: true,
              },
            ],
          },
          'suite 2': {
            tests: [
              'test 1',
              {
                name: 'test 2',
                fail: true,
              },
            ],
          },
        },
      })
      .then(shouldHaveFailed(2))
      .then(() => {

        assertMatch(formatEvents(allStubs), [
          ['run:start'],
          [
            'test:before:run',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r3',
              'title': 'test 1',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r3',
              'title': 'test 1',
              'state': 'passed',
            },
          ],
          [
            'test:before:run',
            {
              'id': 'r4',
              'title': 'test 2',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r4',
              'title': 'test 2',
            },
          ],
          ['fail',		{}],
          [
            'runnable:after:run:async',
            {
              'id': 'r4',
              'title': 'test 2',
              'err': '[Object]',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r4',
              'title': 'test 2',
              'err': '[Object]',
              'state': 'failed',
            },
          ],
          [
            'test:before:run',
            {
              'id': 'r6',
              'title': 'test 1',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r6',
              'title': 'test 1',
            },
          ],
          [
            'runnable:after:run:async',
            {
              'id': 'r6',
              'title': 'test 1',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r6',
              'title': 'test 1',
              'state': 'passed',
            },
          ],
          [
            'test:before:run',
            {
              'id': 'r7',
              'title': 'test 2',
            },
          ],
          [
            'test:before:run:async',
            {
              'id': 'r7',
              'title': 'test 2',
            },
          ],
          ['fail', {}],
          [
            'runnable:after:run:async',
            {
              'id': 'r7',
              'title': 'test 2',
              'err': '[Object]',
            },
          ],
          [
            'test:after:run',
            {
              'id': 'r7',
              'title': 'test 2',
              'err': '[Object]',
              'state': 'failed',
            },
          ],
          ['run:end'],
        ])
      })
    })
    it('no tests', function () {
      return this.runMochaTests({})
      .then(shouldHaveFailed(0))
      .then(() => {
        assertMatch(formatEvents(allStubs), [['run:start'], ['run:end']])
      })
    })
    it('simple fail, catch cy.on(fail)', function () {
      return this.runMochaTests({
        suites: {
          'suite 1': {
            tests: [
              {
                name: 'test 1',
                fn: () => {
                  cy.on('fail', () => {
                    return false
                  })
                  throw new Error('error in test')
                },

              },
            ],
          },
        },
      })
      .then(shouldHaveFailed(0))
      .then(() => {

        assertMatch(formatEvents(allStubs), [
          ['run:start'],
          ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
          ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
          ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
          ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'state': 'passed'		}],
          ['run:end'],
        ])
      })
    })

    describe('hook failures', () => {
      it('fail in [before]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [
                {
                  type: 'before',
                  fail: true,
                },
              ],
              tests: [{ name: 'test 1' }],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': '"before all" hook',			'hookName': 'before all',			'hookId': 'h1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'hookName': 'before all',			'err': '[Object]',			'state': 'failed',			'failedFromHookId': 'h1'		}],
            ['run:end'],
          ])
        })
      })

      it('fail in [beforeEach]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [
                {
                  type: 'beforeEach',
                  fail: true,
                },
              ],
              tests: [{ name: 'test 1' }],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{ 'id': 'r3',			'title': 'test 1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': '"before each" hook',			'hookName': 'before each',			'hookId': 'h1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'hookName': 'before each',			'err': '[Object]',			'state': 'failed',			'failedFromHookId': 'h1'		}],
            ['run:end'],
          ])
        })
      })

      it('fail in [afterEach]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [
                {
                  type: 'afterEach',
                  fail: true,
                },
              ],
              tests: [{ name: 'test 1' }],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': '"after each" hook',			'hookName': 'after each',			'hookId': 'h1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'hookName': 'after each',			'err': '[Object]',			'state': 'failed',			'failedFromHookId': 'h1'		}],
            ['run:end'],
          ])
        })
      })
      it('fail in [after]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [
                {
                  type: 'after',
                  fail: true,
                },
              ],
              tests: [{ name: 'test 1' }],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': '"after all" hook',			'hookName': 'after all',			'hookId': 'h1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'hookName': 'after all',			'err': '[Object]',			'state': 'failed',			'failedFromHookId': 'h1'		}],
            ['run:end'],
          ])
        })
      })

      it('fail in [after], skip remaining tests', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [
                {
                  type: 'after',
                  fail: true,
                },
              ],
              tests: ['test 1', 'test 2'],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'state': 'passed'		}],
            ['test:before:run',		{			'id': 'r4',			'title': 'test 2'		}],
            ['test:before:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['runnable:after:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r4',			'title': '"after all" hook',			'hookName': 'after all',			'hookId': 'h1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r4',			'title': 'test 2',			'hookName': 'after all',			'err': '[Object]',			'state': 'failed',			'failedFromHookId': 'h1'		}],
            ['run:end'],
          ])
        })
      })

    })
    describe('test failures w/ hooks', () => {

      it('fail with [before]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: ['before'],
              tests: [
                {
                  name: 'test 1',
                  fail: true,

                },
                { name: 'test 2' },
              ],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': '"before all" hook',			'hookName': 'before all',			'hookId': 'h1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'err': '[Object]',			'state': 'failed'		}],
            ['test:before:run',		{			'id': 'r4',			'title': 'test 2'		}],
            ['test:before:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['runnable:after:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['test:after:run',		{			'id': 'r4',			'title': 'test 2',			'state': 'passed'		}],
            ['run:end'],
          ])
        })
      })

      it('fail with [after]', function () {
        return this.runMochaTests({
          suites: {
            'suite 1': {
              hooks: [{ type: 'after' }],
              tests: [{ name: 'test 1', fail: true }, 'test 2'],
            },
          },
        })
        .then(shouldHaveFailed(1))
        .then(() => {

          assertMatch(formatEvents(allStubs), [
            ['run:start'],
            ['test:before:run',		{			'id': 'r3',			'title': 'test 1'		}],
            ['test:before:run:async',		{			'id': 'r3',			'title': 'test 1'		}],
            ['fail',		{}],
            ['runnable:after:run:async',		{			'id': 'r3',			'title': 'test 1',			'err': '[Object]'		}],
            ['test:after:run',		{			'id': 'r3',			'title': 'test 1',			'err': '[Object]',			'state': 'failed'		}],
            ['test:before:run',		{			'id': 'r4',			'title': 'test 2'		}],
            ['test:before:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['runnable:after:run:async',		{			'id': 'r4',			'title': 'test 2'		}],
            ['runnable:after:run:async',		{			'id': 'r4',			'title': '"after all" hook',			'hookName': 'after all',			'hookId': 'h1'		}],
            ['test:after:run',		{			'id': 'r4',			'title': 'test 2',			'state': 'passed'		}],
            ['run:end'],
          ])
        })
      })
    })
  })
})

const cleanse = (obj = {}, keys) => {
  return _.mapValues(obj, (value, key) => {
    if (keys[key] !== undefined) {
      return keys[key]
    }

    if (_.includes(keys, key)) {
      return `[${Object.prototype.toString.call(value).split(' ')[1]}`
    }

    return value
  })
}

const formatEvents = (stub) => {
  return stub.args.map((args) => {
    if (_.isObject(args[1])) {
      args[1] = _.omit(args[1], [
        'body',
        'timings',
        'type',
        'wallClockStartedAt',
        'duration',
        'wallClockDuration',
      ])
      args[1] = cleanse(args[1], ['err'])

    }

    let ret = [args[0]]

    if (args[1] != null) {
      ret = ret.concat([args[1]])
    }

    return ret
  })
}

const shouldHaveFailed = (exp) => {

  if (exp === undefined) {
    exp = match.number.and(match.truthy)
  }

  return (act) => {
    assertMatch(act, exp, 'tests failed')
  }
}

const shouldHavePassed = () => {
  return shouldHaveFailed(0)
}

const isMatch = (exp, act) => {

  // @ts-ignore
  if (match.isMatcher(exp)) {
    return {
      match: exp.test(act),
      message: exp.message,
    }
  }

  return isMatch(match(exp), act)
}

const assertMatch = (act, exp, message) => {
  const res = isMatch(exp, act)

  if (!res.match) {
    // eslint-disable-next-line
		console.log(exp, act)
    // console.log(jestDiff(exp, act))
    if (_.isObject(act)) {
      lastActual = act
      assert(false, `expected object ${res.message}: ${jestDiff(exp, act)}`)
    }

    assert(false, `expected ${res.message}, but was ${act}`)

  }

  assert(true, `expected ${message || 'var'} to ${res.message}`)
}

function copyToClipboard (text) {

  let aux = document.createElement('input')

  aux.setAttribute('value', text)
  document.body.appendChild(aux)
  aux.select()
  document.execCommand('copy')
  document.body.removeChild(aux)

}

