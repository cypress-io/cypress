import { calculateTestStatus } from '../../../src/cypress/mocha.ts'

describe('mocha custom methods', () => {
  describe('calculateTestStatus', () => {
    let totalRetries = 2
    const createMockTest = (state = 'passed', prevAttempts = []) => {
      const mockTestContext = {
        currentRetry () {
          return prevAttempts.length
        },
        retries () {
          return totalRetries
        },
        state,
        prevAttempts,
      }

      return Cypress._.cloneDeep(mockTestContext)
    }

    describe('strategy w/ experimentalBurnIn=false', () => {
      it('should never attempt to retry a test that passes on the first try, regardless of strategy', function () {
        const undefinedStrategyTest = createMockTest()
        const noExperimentalRetries = calculateTestStatus.call(undefinedStrategyTest)

        expect(noExperimentalRetries.outerStatus).to.equal('passed')
        expect(noExperimentalRetries.attempts).to.equal(1)
        expect(noExperimentalRetries.shouldAttemptsContinue).to.be.false
        expect(noExperimentalRetries.strategy).to.be.undefined
        expect(undefinedStrategyTest.final).to.be.true

        const detectFlakeAndPassOnThresholdStrategyTest = createMockTest()
        const detectFlakeAndPassOnThreshold = calculateTestStatus.call(detectFlakeAndPassOnThresholdStrategyTest, 'detect-flake-and-pass-on-threshold', {
          maxRetries: 8,
          passesRequired: 5,
        })

        expect(detectFlakeAndPassOnThreshold.outerStatus).to.equal('passed')
        expect(detectFlakeAndPassOnThreshold.attempts).to.equal(1)
        expect(detectFlakeAndPassOnThreshold.shouldAttemptsContinue).to.be.false
        expect(detectFlakeAndPassOnThreshold.strategy).to.equal('detect-flake-and-pass-on-threshold')
        expect(detectFlakeAndPassOnThresholdStrategyTest.final).to.be.true

        const detectFlakeButAlwaysFailStrategyTest = createMockTest()
        const detectFlakeButAlwaysFail = calculateTestStatus.call(detectFlakeButAlwaysFailStrategyTest, 'detect-flake-but-always-fail', {
          maxRetries: 8,
          stopIfAnyPassed: false,
        })

        expect(detectFlakeButAlwaysFail.outerStatus).to.equal('passed')
        expect(detectFlakeButAlwaysFail.attempts).to.equal(1)
        expect(detectFlakeButAlwaysFail.shouldAttemptsContinue).to.be.false
        expect(detectFlakeButAlwaysFail.strategy).to.equal('detect-flake-but-always-fail')
        expect(detectFlakeButAlwaysFailStrategyTest.final).to.be.true
      })

      describe('undefined (GA implementation/original)', () => {
        it('passed: keeps signaling to retry until test passes', function () {
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1)

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.be.undefined

          const mockTest2 = createMockTest('passed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2)

          expect(attempt2.outerStatus).to.equal('passed')
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.false
          expect(attempt2.strategy).to.be.undefined
        })

        // this logic is NOT inclusive of after/afterEach hooks, which can still set the test state after the test has calculated the meta data properties.
        // this happens inside ./driver/src/cypress/runner.ts
        it('failed: keeps signaling to retry until retry limit is reached', function () {
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1)

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.be.undefined

          const mockTest2 = createMockTest('failed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2)

          expect(attempt2.outerStatus).to.be.undefined
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.true
          expect(attempt2.strategy).to.be.undefined

          const mockTest3 = createMockTest('failed', [mockTest1, mockTest2])
          const attempt3 = calculateTestStatus.call(mockTest3)

          expect(attempt3.outerStatus).to.equal('failed')
          expect(attempt3.attempts).to.equal(3)
          expect(attempt3.shouldAttemptsContinue).to.be.false
          expect(attempt3.strategy).to.be.undefined
        })
      })

      describe('detect-flake-and-pass-on-threshold', () => {
        it('passed: no longer signals to retry test after passesRequired threshold is reached', function () {
          totalRetries = 5
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest1.final).to.be.false

          const mockTest2 = createMockTest('failed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt2.outerStatus).to.be.undefined
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.true
          expect(attempt2.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest2.final).to.be.false

          const mockTest3 = createMockTest('passed', [mockTest1, mockTest2])
          const attempt3 = calculateTestStatus.call(mockTest3, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt3.outerStatus).to.be.undefined
          expect(attempt3.attempts).to.equal(3)
          expect(attempt3.shouldAttemptsContinue).to.be.true
          expect(attempt3.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest3.final).to.be.false

          const mockTest4 = createMockTest('passed', [mockTest1, mockTest2, mockTest3])
          const attempt4 = calculateTestStatus.call(mockTest4, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt4.outerStatus).to.equal('passed')
          expect(attempt4.attempts).to.equal(4)
          expect(attempt4.shouldAttemptsContinue).to.be.false
          expect(attempt4.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest4.final).to.be.true
        })

        it('failed: no longer signals to retry test if the passesRequired is impossible to meet', function () {
          totalRetries = 4
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest1.final).to.be.false

          const mockTest2 = createMockTest('failed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt2.outerStatus).to.be.undefined
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.true
          expect(attempt2.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest2.final).to.be.false

          const mockTest3 = createMockTest('failed', [mockTest1, mockTest2])
          const attempt3 = calculateTestStatus.call(mockTest3, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt3.outerStatus).to.be.undefined
          expect(attempt3.attempts).to.equal(3)
          expect(attempt3.shouldAttemptsContinue).to.be.true
          expect(attempt3.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest3.final).to.be.false

          const mockTest4 = createMockTest('failed', [mockTest1, mockTest2, mockTest3])
          const attempt4 = calculateTestStatus.call(mockTest4, 'detect-flake-and-pass-on-threshold', {
            maxRetries: totalRetries,
            passesRequired: 2,
          })

          expect(attempt4.outerStatus).to.equal('failed')
          expect(attempt4.attempts).to.equal(4)
          expect(attempt4.shouldAttemptsContinue).to.be.false
          expect(attempt4.strategy).to.equal('detect-flake-and-pass-on-threshold')
          expect(mockTest4.final).to.be.true
        })
      })

      describe('detect-flake-but-always-fail', () => {
        it('failed: no longer signals to retry after retries are exhausted', function () {
          totalRetries = 3
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: false,
          })

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest1.final).to.be.false

          const mockTest2 = createMockTest('failed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: false,
          })

          expect(attempt2.outerStatus).to.be.undefined
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.true
          expect(attempt2.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest2.final).to.be.false

          const mockTest3 = createMockTest('passed', [mockTest1, mockTest2])
          const attempt3 = calculateTestStatus.call(mockTest3, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: false,
          })

          expect(attempt3.outerStatus).to.be.undefined
          expect(attempt3.attempts).to.equal(3)
          expect(attempt3.shouldAttemptsContinue).to.be.true
          expect(attempt3.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest3.final).to.be.false

          const mockTest4 = createMockTest('passed', [mockTest1, mockTest2, mockTest3])
          const attempt4 = calculateTestStatus.call(mockTest4, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: false,
          })

          expect(attempt4.outerStatus).to.equal('failed')
          expect(attempt4.attempts).to.equal(4)
          expect(attempt4.shouldAttemptsContinue).to.be.false
          expect(attempt4.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest4.final).to.be.true
          // make sure forceState is called on 'detect-flake-but-always-fail' in the case the last test attempt passed, but the outer status should indicate a failure
          expect(mockTest4.forceState).to.equal('passed')
        })

        it('failed: short circuits after a retry has a passed test', function () {
          totalRetries = 3
          const mockTest1 = createMockTest('failed')
          const attempt1 = calculateTestStatus.call(mockTest1, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: true,
          })

          expect(attempt1.outerStatus).to.be.undefined
          expect(attempt1.attempts).to.equal(1)
          expect(attempt1.shouldAttemptsContinue).to.be.true
          expect(attempt1.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest1.final).to.be.false

          const mockTest2 = createMockTest('passed', [mockTest1])
          const attempt2 = calculateTestStatus.call(mockTest2, 'detect-flake-but-always-fail', {
            maxRetries: totalRetries,
            stopIfAnyPassed: true,
          })

          expect(attempt2.outerStatus).to.equal('failed')
          expect(attempt2.attempts).to.equal(2)
          expect(attempt2.shouldAttemptsContinue).to.be.false
          expect(attempt2.strategy).to.equal('detect-flake-but-always-fail')
          expect(mockTest2.final).to.true
          // make sure forceState is called on 'detect-flake-but-always-fail' in the case the last test attempt passed, but the outer status should indicate a failure
          expect(mockTest2.forceState).to.equal('passed')
        })
      })
    })
  })
})
