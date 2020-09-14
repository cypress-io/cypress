const helpers = require('../support/helpers')

const { shouldHaveTestResults, getRunState, cleanseRunStateMap } = helpers
const { runIsolatedCypress, snapshotMochaEvents, getAutCypress } = helpers.createCypress({ config: { retries: 2, isTextTerminal: true, firefoxGcInterval: null } })
const { sinon } = Cypress
const match = Cypress.sinon.match

const threeTestsWithRetry = {
  suites: {
    'suite 1': {
      hooks: ['before', 'beforeEach', 'afterEach', 'after'],
      tests: [
        'test 1',
        { name: 'test 2', fail: 2 },
        'test 3',
      ],
    },
  },
}

describe('src/cypress/runner retries mochaEvents', () => {
  // NOTE: for test-retries
  it('can set retry config', () => {
    runIsolatedCypress({}, { config: { retries: 1 } })
    .then(({ autCypress }) => {
      expect(autCypress.config()).to.has.property('retries', 1)
    })
  })

  it('simple retry', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          tests: [
            { name: 'test 1',
              fail: 1,
            },
          ],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('test retry with hooks', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          hooks: ['before', 'beforeEach', 'afterEach', 'after'],
          tests: [{ name: 'test 1', fail: 1 }],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('test retry with [only]', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          hooks: ['before', 'beforeEach', 'afterEach', 'after'],
          tests: [
            { name: 'test 1' },
            { name: 'test 2', fail: 1, only: true },
            { name: 'test 3' },
          ],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('can retry from [beforeEach]', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          hooks: [
            'before',
            'beforeEach',
            { type: 'beforeEach', fail: 1 },
            'beforeEach',
            'afterEach',
            'after',
          ],
          tests: [{ name: 'test 1' }],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('can retry from [afterEach]', () => {
    runIsolatedCypress({
      hooks: [{ type: 'afterEach', fail: 1 }],
      suites: {
        'suite 1': {
          hooks: [
            'before',
            'beforeEach',
            'beforeEach',
            'afterEach',
            'after',
          ],
          tests: [{ name: 'test 1' }, 'test 2', 'test 3'],
        },
        'suite 2': {
          hooks: [{ type: 'afterEach', fail: 2 }],
          tests: ['test 1'],
        },
        'suite 3': {
          tests: ['test 1'],
        },
      },
    }, { config: { retries: 2, isTextTerminal: true } })

    .then(snapshotMochaEvents)
  })

  it('cant retry from [before]', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          hooks: [
            { type: 'before', fail: 1 },
            'beforeEach',
            'beforeEach',
            'afterEach',
            'afterEach',
            'after',
          ],
          tests: [{ name: 'test 1' }],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('cant retry from [after]', () => {
    runIsolatedCypress({
      suites: {
        'suite 1': {
          hooks: [
            'before',
            'beforeEach',
            'beforeEach',
            'afterEach',
            'afterEach',
            { type: 'after', fail: 1 },
          ],
          tests: [{ name: 'test 1' }],
        },
      },
    }, { config: { retries: 1 } })
    .then(snapshotMochaEvents)
  })

  it('three tests with retry', () => {
    runIsolatedCypress(threeTestsWithRetry, {
      config: {
        retries: 2,
      },
    })
    .then(snapshotMochaEvents)
  })

  describe('screenshots', () => {
    it('retry screenshot in test body', () => {
      let onAfterScreenshot

      runIsolatedCypress({
        suites: {
          'suite 1': {
            tests: [
              {
                name: 'test 1',
                fn: () => {
                  cy.screenshot()
                  cy.then(() => assert(false))
                },
                eval: true,
              },
            ],
          },
        },
      }, { config: { retries: 1 },
        onBeforeRun ({ autCypress }) {
          autCypress.Screenshot.onAfterScreenshot = cy.stub()
          onAfterScreenshot = cy.stub()
          autCypress.on('after:screenshot', onAfterScreenshot)
        },
      })
      .then(({ autCypress }) => {
        expect(autCypress.automation.withArgs('take:screenshot')).callCount(4)
        expect(autCypress.automation.withArgs('take:screenshot').args).matchDeep([
          { 1: { testAttemptIndex: 0 } },
          { 1: { testAttemptIndex: 0 } },
          { 1: { testAttemptIndex: 1 } },
          { 1: { testAttemptIndex: 1 } },
        ])

        expect(autCypress.automation.withArgs('take:screenshot').args[0]).matchSnapshot({ startTime: match.string, testAttemptIndex: match(0) })
        expect(onAfterScreenshot.args[0][0]).to.matchSnapshot({ testAttemptIndex: match(0) })
        expect(onAfterScreenshot.args[2][0]).to.matchDeep({ testAttemptIndex: 1 })
      })
    })

    it('retry screenshot in hook', () => {
      let onAfterScreenshot

      runIsolatedCypress({
        suites: {
          'suite 1': {
            hooks: [
              {
                type: 'beforeEach',
                fn: () => {
                  cy.screenshot()
                  cy.then(() => assert(false))
                },
                eval: true,
              },
            ],
            tests: [
              {
                name: 'test 1',
              },
            ],
          },
        },
      }, { config: { retries: 1 },
        onBeforeRun ({ autCypress }) {
          autCypress.Screenshot.onAfterScreenshot = cy.stub()
          onAfterScreenshot = cy.stub()
          autCypress.on('after:screenshot', onAfterScreenshot)
        },
      })
      .then(({ autCypress }) => {
        expect(autCypress.automation.withArgs('take:screenshot')).callCount(4)
        expect(autCypress.automation.withArgs('take:screenshot').args).matchDeep([
          { 1: { testAttemptIndex: 0 } },
          { 1: { testAttemptIndex: 0 } },
          { 1: { testAttemptIndex: 1 } },
          { 1: { testAttemptIndex: 1 } },
        ])

        expect(onAfterScreenshot.args[0][0]).matchDeep({ testAttemptIndex: 0 })
        expect(onAfterScreenshot.args[2][0]).matchDeep({ testAttemptIndex: 1 })
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/8363
  describe('cleanses errors before emitting', () => {
    it('does not try to serialize error with err.actual as DOM node', () => {
      runIsolatedCypress(() => {
        it('visits', () => {
          cy.visit('/fixtures/dom.html')
          cy.get('#button').should('not.be.visible')
        })
      }, { config: { defaultCommandTimeout: 200 } })
      // should not have err.actual, expected properties since the subject is a DOM element
      .then(snapshotMochaEvents)
    })
  })

  describe('save/reload state', () => {
    const serializeState = () => {
      return getRunState(getAutCypress())
    }

    const loadStateFromSnapshot = (cypressConfig, name) => {
      cy.task('getSnapshot', {
        file: Cypress.spec.name,
        exactSpecName: name,
      })
      .then((state) => {
        cypressConfig[1].state = state
      })
    }

    // NOTE: for test-retries
    describe('retries rehydrate spec state after navigation', () => {
      let realState

      let runCount = 0
      const failThenSerialize = () => {
        if (!runCount++) {
          assert(false, 'stub 3 fail')
        }

        assert(true, 'stub 3 pass')

        return realState = serializeState()
      }

      let runCount2 = 0
      const failOnce = () => {
        if (!runCount2++) {
          assert(false, 'stub 2 fail')
        }

        assert(true, 'stub 2 pass')
      }

      const stub1 = sinon.stub()
      const stub2 = sinon.stub().callsFake(failOnce)
      const stub3 = sinon.stub().callsFake(failThenSerialize)

      let cypressConfig = [
        {
          suites: {
            'suite 1': {
              hooks: [
                'before',
                'beforeEach',
                'afterEach',
                'after',
              ],
              tests: [{ name: 'test 1', fn: stub1 }],
            },
            'suite 2': {
              tests: [
                { name: 'test 1', fn: stub2 },
                { name: 'test 2', fn: stub3 },
                'test 3',
              ],
            },
          },
        }, { config: { retries: 1 } },
      ]

      it('1/2', () => {
        runIsolatedCypress(...cypressConfig)
        .then(shouldHaveTestResults(4, 0))
        .then(() => {
          expect(realState).to.matchSnapshot(cleanseRunStateMap, 'serialize state - retries')
        })
      })

      it('2/2', () => {
        loadStateFromSnapshot(cypressConfig, 'serialize state - retries')
        runIsolatedCypress(...cypressConfig)
        .then(shouldHaveTestResults(4, 0))
        .then(() => {
          expect(stub1).to.calledOnce
          expect(stub2).to.calledTwice
          expect(stub3).calledThrice
        })
      })
    })
  })
})
