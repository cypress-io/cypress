import sinon from 'sinon'
import { logger } from '../../../src/runner/logger'
import _ from 'lodash'

describe('logger', () => {
  let spyLog = sinon.spy(logger, 'log')

  afterEach(() => {
    // reset after each unit test
    spyLog.resetHistory()
  })

  // https://github.com/cypress-io/cypress/issues/17542
  it('cy.log() shows all arguments in each line when there are multiple args', () => {
    logger.logFormatted({ args: [1, 2, 3] })

    expect(spyLog).to.have.been.calledWith(`%cArgs:`, 'font-weight: bold')
    expect(spyLog).to.have.been.calledWith(`%c  [0]:`, 'font-weight: bold', 1)
    expect(spyLog).to.have.been.calledWith(`%c  [1]:`, 'font-weight: bold', 2)
    expect(spyLog).to.have.been.calledWith(`%c  [2]:`, 'font-weight: bold', 3)
  })

  describe('_logValues', () => {
    let spyTrim = sinon.spy(_, 'trim')

    afterEach(() => {
      // reset after each unit test
      spyTrim.resetHistory()
    })

    it('should not call trim', () => {
      logger._logValues({})
      logger._logValues({ test: {} })
      logger._logValues(null)
      logger._logValues(undefined)

      expect(spyTrim.getCalls()).to.have.length(0)
    })

    // The positive unit tests to capture if log has been called are already written in
    // the 'cy.log() shows all arguments in each line when there are multiple args' unit test.
  })
})
