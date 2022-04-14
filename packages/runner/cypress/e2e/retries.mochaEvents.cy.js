const helpers = require('../support/helpers')

const { shouldHaveTestResults, getRunState, cleanseRunStateMap } = helpers
const { runIsolatedCypress, getAutCypress } = helpers.createCypress({ config: { retries: 2, isTextTerminal: true } })
const { sinon } = Cypress
const match = Cypress.sinon.match

describe('src/cypress/runner retries mochaEvents', { retries: 0 }, () => {
  // NOTE: for test-retries
  it('can set retry config', () => {
    runIsolatedCypress({}, { config: { retries: 1 } })
    .then(({ autCypress }) => {
      expect(autCypress.config()).to.has.property('retries', 1)
    })
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
