const { _ } = Cypress
const sinon = require('sinon')
const helpers = require('../support/helpers')

const { cleanseRunStateMap, shouldHaveTestResults, getRunState } = helpers
const { runIsolatedCypress, getAutCypress } = helpers.createCypress({ config: { isTextTerminal: true, retries: 0 } })

describe('src/cypress/runner', { retries: 0 }, () => {
  describe('save/reload state on top navigation', () => {
    describe('serialize / load from state', () => {
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

      describe('hooks', () => {
        let realState
        const stub1 = sinon.stub()
        const stub2 = sinon.stub()
        const stub3 = sinon.stub().callsFake(() => realState = serializeState())
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
          }, {},
        ]

        // TODO: make this one test with multiple visits
        it('serialize state', () => {
          runIsolatedCypress(...cypressConfig)
          .then(shouldHaveTestResults(4, 0))
          .then(() => {
            expect(realState).to.matchSnapshot(cleanseRunStateMap, 'serialize state - hooks')
          })
        })

        it('load state', () => {
          loadStateFromSnapshot(cypressConfig, 'serialize state - hooks')

          runIsolatedCypress(...cypressConfig)
          .then(shouldHaveTestResults(4, 0))
          .then(() => {
            expect(stub1).to.calledOnce
            expect(stub2).to.calledOnce
            expect(stub3).to.calledTwice
          })
        })
      })
    })
  })

  describe('other specs', () => {
    it('mocha suite:end fire before test:pass event', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': {
            suites: {
              'suite 1-1': {
                tests: ['test 1', 'test 2'],
              },
            },
          },
        },
      }).then(({ mochaStubs }) => {
        const getOrderFired = (eventProps) => {
          const event = _.find(mochaStubs.args, eventProps)

          expect(event).ok

          return _.indexOf(mochaStubs.args, event)
        }

        expect(getOrderFired({ 1: 'pass', 2: { title: 'test 2' } }))
        .to.be.lt(getOrderFired({ 1: 'suite end', 2: { title: 'suite 1-1' } }))
      })
    })

    it('buffer mocha pass event when fail in afterEach hooks', () => {
      runIsolatedCypress({
        suites: {
          'suite 1': {
            suites: {
              'suite 1-1': {
                hooks: [{ type: 'afterEach', fail: true }],
                tests: ['test 1'],
              },
            },
          },
        },
      }).then(({ mochaStubs }) => {
        expect(_.find(mochaStubs.args, { 1: 'pass' })).not.exist
      })
    })

    describe('screenshots', () => {
      it('screenshot after failed test', () => {
        runIsolatedCypress({
          suites: {
            'suite 1': {
              tests: [
                {
                  name: 'test 1',
                  fn: () => {
                    assert(false, 'some error')
                  },
                  eval: true,
                },
              ],
            },
          },
        })
        .then(({ autCypress }) => {
          // sent to server
          expect(autCypress.automation.withArgs('take:screenshot').args).to.matchSnapshot(cleanseRunStateMap)

          //// on('after:screenshot')
          // TODO: for some reason snapshot is not properly saved
          // expect(onAfterScreenshotListener.args).to.matchSnapshot(cleanseRunStateMap)

          //// Screenshot.onAfterScreenshot
          // TODO: for some reason snapshot is not properly saved
          // expect(autCypress.Screenshot.onAfterScreenshot.args).to.matchSnapshot(
          //   { '^.0.0': stringifyShort, 'test': stringifyShort, takenAt: match.string },
          // )
        })
      })
    })
  })

  describe('event listeners', () => {
    // https://github.com/cypress-io/cypress/issues/8701
    it('does not hang when error thrown in test:after:run', () => {
      runIsolatedCypress(() => {
        Cypress.on('test:after:run', (test) => {
          throw new Error('I am throwing')
        })

        describe('page', { defaultCommandTimeout: 400 }, () => {
          it('t1', { retries: 2 }, () => {
            assert(false)
          })

          it('t2', () => {
            assert(true)
          })
        })
      })
    })
  })
})
