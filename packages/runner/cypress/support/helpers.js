/* eslint prefer-rest-params: "off", no-console: "off", arrow-body-style: "off"*/

const { _ } = Cypress
const debug = require('debug')('spec')
const snapshotCommand = require('../plugins/snapshot/snapshotCommand')

/**
 * @type {sinon.SinonMatch}
 */
const match = Cypress.sinon.match

const { stringifyShort } = snapshotCommand

const eventCleanseMap = {
  snapshots: stringifyShort,
  parent: stringifyShort,
  tests: stringifyShort,
  commands: stringifyShort,
  invocationDetails: stringifyShort,
  body: '[body]',
  wallClockStartedAt: match.date,
  lifecycle: match.number,
  fnDuration: match.number,
  duration: match.number,
  afterFnDuration: match.number,
  wallClockDuration: match.number,
  stack: match.string,
  message: '[error message]',
  sourceMappedStack: match.string,
  parsedStack: match.array,
}

const mochaEventCleanseMap = {
  ...eventCleanseMap,
  start: match.date,
  end: match.date,
}

const cleanseRunStateMap = {
  ...eventCleanseMap,
  'err.stack': '[err stack]',
  wallClockStartedAt: new Date(0),
  wallClockDuration: 1,
  fnDuration: 1,
  afterFnDuration: 1,
  lifecycle: 1,
  duration: 1,
  startTime: new Date(0),
}

const spyOn = (obj, prop, fn) => {
  const _fn = obj[prop]

  obj[prop] = function () {
    fn.apply(this, arguments)

    const ret = _fn.apply(this, arguments)

    return ret
  }
}

function createCypress (defaultOptions = {}) {
  /**
   * @type {sinon.SinonStub}
   */
  let allStubs
  /**
     * @type {sinon.SinonStub}
     */
  let mochaStubs
  /**
     * @type {sinon.SinonStub}
     */
  let setRunnablesStub

  const enableStubSnapshots = false
  // const enableStubSnapshots = true

  let autCypress

  const getAutCypress = () => autCypress

  const snapshotMochaEvents = () => {
    expect(mochaStubs.args).to.matchSnapshot(mochaEventCleanseMap, name.mocha)
  }

  snapshotCommand.registerInCypress()

  const backupCy = window.cy
  const backupCypress = window.Cypress

  beforeEach(() => {
    window.cy = backupCy
    window.Cypress = backupCypress
  })

  /**
   * Spawns an isolated Cypress runner as the AUT, with provided spec/fixture and optional state/config
   * @param {string | ()=>void | {[key:string]: any}} mochaTestsOrFile
   * @param {{state?: any, config?: any}} opts
   */
  const runIsolatedCypress = (mochaTestsOrFile, opts = {}) => {
    opts = _.defaultsDeep(opts, defaultOptions, {
      state: {},
      config: { video: false },
      onBeforeRun () {},
      visitUrl: 'http://localhost:3500/fixtures/dom.html',
    })

    return cy.visit('/fixtures/isolated-runner.html#/tests/cypress/fixtures/empty_spec.js')
    .then({ timeout: 60000 }, (win) => {
      win.runnerWs.destroy()

      allStubs = cy.stub().snapshot(enableStubSnapshots).log(false)
      mochaStubs = cy.stub().snapshot(enableStubSnapshots).log(false)
      setRunnablesStub = cy.stub().snapshot(enableStubSnapshots).log(false)

      return new Promise((resolve) => {
        const runIsolatedCypress = () => {
          autCypress.run.restore()

          const emit = autCypress.emit
          const emitMap = autCypress.emitMap
          const emitThen = autCypress.emitThen

          cy.stub(autCypress, 'automation').log(false).snapshot(enableStubSnapshots)
          .callThrough()
          .withArgs('clear:cookies')
          .resolves({
            foo: 'bar',
          })
          .withArgs('take:screenshot')
          .resolves({
            path: '/path/to/screenshot',
            size: 12,
            dimensions: { width: 20, height: 20 },
            multipart: false,
            pixelRatio: 1,
            takenAt: new Date().toISOString(),
            name: 'name',
            blackout: ['.foo'],
            duration: 100,
          })

          cy.stub(autCypress, 'emit').snapshot(enableStubSnapshots).log(false)
          .callsFake(function () {
            const noLog = _.includes([
              'navigation:changed',
              'stability:changed',
              'window:load',
              'url:changed',
              'log:added',
              'page:loading',
              'window:unload',
              'newListener',
            ], arguments[0])
            const noCall = _.includes(['window:before:unload', 'mocha'], arguments[0])
            const isMocha = _.includes(['mocha'], arguments[0])

            if (isMocha) {
              mochaStubs.apply(this, arguments)
            }

            noLog || allStubs.apply(this, ['emit'].concat([].slice.call(arguments)))

            return noCall || emit.apply(this, arguments)
          })

          cy.stub(autCypress, 'emitMap').snapshot(enableStubSnapshots).log(false)
          .callsFake(function () {
            allStubs.apply(this, ['emitMap'].concat([].slice.call(arguments)))

            return emitMap.apply(this, arguments)
          })

          cy.stub(autCypress, 'emitThen').snapshot(enableStubSnapshots).log(false)
          .callsFake(function () {
            allStubs.apply(this, ['emitThen'].concat([].slice.call(arguments)))

            return emitThen.apply(this, arguments)
          })

          spyOn(autCypress.mocha.getRunner(), 'fail', (...args) => {
            Cypress.log({
              name: 'Runner (fail event)',
              ended: true,
              event: true,
              message: `${args[1]}`,
              state: 'failed',
              consoleProps: () => {
                return {
                  Error: args[1],
                }
              },
            })
          })

          // TODO: clean this up, sinon doesn't like wrapping things multiple times
          // and this catches that error
          try {
            cy.spy(cy.state('window').console, 'log').as('console_log').log(false)
            cy.spy(cy.state('window').console, 'error').as('console_error').log(false)
          } catch (_e) {
            // console was already wrapped, noop
          }

          autCypress.run((failed) => {
            resolve({ failed, mochaStubs, autCypress, win })
          })
        }

        cy.spy(win.eventManager.reporterBus, 'emit').snapshot(enableStubSnapshots).log(false).as('reporterBus')
        cy.spy(win.eventManager.localBus, 'emit').snapshot(enableStubSnapshots).log(false).as('localBus')

        cy.stub(win.runnerWs, 'emit').snapshot(enableStubSnapshots).log(false)
        .withArgs('watch:test:file')
        .callsFake(() => {
          autCypress = win.Cypress

          cy.stub(autCypress, 'onSpecWindow').snapshot(enableStubSnapshots).log(false).callsFake((specWindow) => {
            autCypress.onSpecWindow.restore()

            opts.onBeforeRun({ specWindow, win, autCypress })

            const testsInOwnFile = _.isString(mochaTestsOrFile)
            const relativeFile = testsInOwnFile ? mochaTestsOrFile : 'cypress/fixtures/empty_spec.js'

            autCypress.onSpecWindow(specWindow, [
              {
                absolute: relativeFile,
                relative: relativeFile,
                relativeUrl: `/__cypress/tests?p=${relativeFile}`,
              },
            ])

            if (testsInOwnFile) return

            generateMochaTestsForWin(specWindow, mochaTestsOrFile)
          })

          cy.stub(autCypress, 'run').snapshot(enableStubSnapshots).log(false).callsFake(runIsolatedCypress)
        })
        .withArgs('is:automation:client:connected')
        .yieldsAsync(true)

        .withArgs('get:existing:run:state')
        .callsFake((evt, cb) => {
          cb(opts.state)
        })

        .withArgs('backend:request', 'reset:server:state')
        .yieldsAsync({})

        .withArgs('backend:request', 'resolve:url')
        .yieldsAsync({ response: {
          isOkStatusCode: true,
          isHtml: true,
          url: opts.visitUrl,
        } })

        .withArgs('set:runnables')
        .callsFake((...args) => {
          setRunnablesStub(...args)
          _.last(args)()
        })

        // .withArgs('preserve:run:state')
        // .callsFake()

        .withArgs('automation:request')
        .yieldsAsync({ response: {} })

        const c = _.extend({}, Cypress.config(), {
          isTextTerminal: false,
          spec: {
            relative: 'relative/path/to/spec.js',
            absolute: '/absolute/path/to/spec.js',
            name: 'empty_spec.js',
          },
        }, opts.config)

        c.state = {}

        cy.stub(win.runnerWs, 'on').snapshot(enableStubSnapshots).log(false)

        win.Runner.start(win.document.getElementById('app'), window.btoa(JSON.stringify(c)))
      })
    })
  }

  const createVerifyTest = (modifier) => {
    return (title, opts, props) => {
      if (!props) {
        props = opts
        opts = null
      }

      const verifyFn = props.verifyFn || verifyFailure

      const args = _.compact([title, opts, () => {
        return runIsolatedCypress(`cypress/fixtures/errors/${props.file}`, {
          onBeforeRun ({ specWindow, win, autCypress }) {
            specWindow.testToRun = title
            specWindow.autWindow = win
            specWindow.autCypress = autCypress

            if (props.onBeforeRun) {
              props.onBeforeRun({ specWindow, win })
            }
          },
        })
        .then(({ win }) => {
          props.codeFrameText = props.codeFrameText || title
          props.win = win
          verifyFn(props)
        })
      }])

  ;(modifier ? it[modifier] : it)(...args)
    }
  }

  const verify = {
    it: createVerifyTest(),
  }

  verify.it['only'] = createVerifyTest('only')
  verify.it['skip'] = createVerifyTest('skip')

  return {
    runIsolatedCypress,
    snapshotMochaEvents,
    getAutCypress,
    verify,
  }
}

const createHooks = (win, hooks = []) => {
  _.each(hooks, (hook) => {
    if (_.isString(hook)) {
      hook = { type: hook }
    }

    let { type, fail, fn, agents } = hook

    if (fn) {
      if (hook.eval) {
        const fnStr = fn.toString()

        const newFn = function () {
          return win.eval(`(${fnStr})`).call(this)
        }

        Object.defineProperty(newFn, 'length', { value: fn.length })
        fn = newFn
      }

      return win[type](fn)
    }

    if (fail) {
      const numFailures = fail

      return win[type](function () {
        const message = `${type} - ${this._runnable.parent.title || 'root'}`

        if (agents) {
          registerAgents(win)
        }

        if (_.isNumber(fail) && fail-- <= 0) {
          debug(`hook pass after (${numFailures}) failures: ${type}`)
          win.assert(true, message)

          return
        }

        if (agents) {
          failCypressCommand(win, type)
        } else {
          debug(`hook fail: ${type}`)

          win.assert(false, message)

          throw new Error(`hook failed: ${type}`)
        }
      })
    }

    return win[type](function () {
      win.assert(true, `${type} - ${this._runnable.parent.title || 'root'}`)
      debug(`hook pass: ${type}`)
    })
  })
}

const createTests = (win, tests = []) => {
  _.each(tests, (test) => {
    if (_.isString(test)) {
      test = { name: test }
    }

    let { name, pending, fail, fn, only, agents } = test

    let it = win.it

    if (only) {
      it = it['only']
    }

    if (fn) {
      if (test.eval) {
        const fnStr = fn.toString()

        const newFn = function () {
          return win.eval(`(${fnStr})`).call(this)
        }

        Object.defineProperty(newFn, 'length', { value: fn.length })
        fn = newFn
      }

      return it(name, fn)
    }

    if (pending) {
      return it(name)
    }

    if (fail) {
      return it(name, () => {
        if (agents) {
          registerAgents(win)
        }

        if (_.isNumber(fail) && fail-- === 0) {
          debug(`test pass after retry: ${name}`)
          win.assert(true, name)

          return
        }

        if (agents) {
          failCypressCommand(win, name)
        } else {
          debug(`test fail: ${name}`)
          win.assert(false, name)

          throw new Error(`test fail: ${name}`)
        }
      })
    }

    return it(name, () => {
      debug(`test pass: ${name}`)
      win.assert(true, name)
    })
  })
}

const failCypressCommand = (win, name) => win.cy.wrap(name).then(() => win.assert(false, name))
const registerAgents = (win) => {
  const obj = { foo: 'bar' }

  win.cy.stub(obj, 'foo')
  win.cy.wrap(obj).should('exist')
  win.cy.server()
  win.cy.route('https://example.com')
}

const createSuites = (win, suites = {}) => {
  _.each(suites, (obj, suiteName) => {
    let fn = () => {
      createHooks(win, obj.hooks)
      createTests(win, obj.tests)
      createSuites(win, obj.suites)
    }

    if (_.isFunction(obj)) {
      fn = evalFn(win, obj)
    }

    win.describe(suiteName, fn)
  })
}

const generateMochaTestsForWin = (win, obj) => {
  if (typeof obj === 'function') {
    win.eval(`( ${obj.toString()})()`)

    return
  }

  createHooks(win, obj.hooks)
  createTests(win, obj.tests)
  createSuites(win, obj.suites)
}

const evalFn = (win, fn) => {
  return function () {
    return win.eval(`(${fn.toString()})`).call(this)
  }
}

const shouldHaveTestResults = (expPassed, expFailed, expPending) => {
  return () => {
    expPassed = expPassed || '--'
    expFailed = expFailed || '--'
    cy.get('header .passed .num').should('have.text', `${expPassed}`)
    cy.get('header .failed .num').should('have.text', `${expFailed}`)
    if (expPending) cy.get('header .pending .num').should('have.text', `${expPending}`)
  }
}

const containText = (text) => {
  return (($el) => {
    expect($el[0]).property('innerText').contain(text)
  })
}

const getRunState = (Cypress) => {
  const currentRunnable = Cypress.cy.state('runnable')
  const currentId = currentRunnable && currentRunnable.id

  const s = {
    currentId,
    tests: Cypress.runner.getTestsState(),
    startTime: Cypress.runner.getStartTime(),
    emissions: Cypress.runner.getEmissions(),
  }

  s.passed = Cypress.runner.countByTestState(s.tests, 'passed')
  s.failed = Cypress.runner.countByTestState(s.tests, 'failed')
  s.pending = Cypress.runner.countByTestState(s.tests, 'pending')
  s.numLogs = Cypress.Log.countLogsByTests(s.tests)

  return _.cloneDeep(s)
}

const verifyFailure = (options) => {
  const {
    hasCodeFrame = true,
    verifyOpenInIde = true,
    column,
    codeFrameText,
    message,
    stack,
    file,
    win,
  } = options
  let { regex, line } = options

  regex = regex || new RegExp(`${file}:${line || '\\d+'}:${column}`)

  const testOpenInIde = () => {
    expect(win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include(file)
  }

  win.runnerWs.emit.withArgs('get:user:editor')
  .yields({
    preferredOpener: {
      id: 'foo-editor',
      name: 'Foo',
      openerId: 'foo-editor',
      isOther: false,
    },
  })

  win.runnerWs.emit.withArgs('open:file')

  cy.contains('View stack trace').click()

  _.each([].concat(message), (msg) => {
    cy.get('.runnable-err-message')
    .should('include.text', msg)

    cy.get('.runnable-err-stack-trace')
    .should('not.include.text', msg)
  })

  cy.get('.runnable-err-stack-trace')
  .invoke('text')
  .should('match', regex)

  if (stack) {
    _.each([].concat(stack), (stackLine) => {
      cy.get('.runnable-err-stack-trace')
      .should('include.text', stackLine)
    })
  }

  cy.get('.runnable-err-stack-trace')
  .should('not.include.text', '__stackReplacementMarker')

  if (verifyOpenInIde) {
    cy.contains('.runnable-err-stack-trace .runnable-err-file-path a', file)
    .click('left')
    .should(() => {
      testOpenInIde()
    })
  }

  if (!hasCodeFrame) return

  cy
  .get('.test-err-code-frame .runnable-err-file-path')
  .invoke('text')
  .should('match', regex)

  cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText)

  if (verifyOpenInIde) {
    cy.contains('.test-err-code-frame .runnable-err-file-path a', file)
    .click()
    .should(() => {
      expect(win.runnerWs.emit.withArgs('open:file')).to.be.calledTwice
      testOpenInIde()
    })
  }
}

module.exports = {
  generateMochaTestsForWin,
  createCypress,
  containText,
  cleanseRunStateMap,
  shouldHaveTestResults,
  getRunState,
}
