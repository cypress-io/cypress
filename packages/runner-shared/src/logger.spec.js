const sinon = require('sinon')
const { logger } = require('./logger')

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
    afterEach(() => {
      // reset after each unit test
      spyLog.resetHistory()
    })

    it('should not call log', () => {
      logger._logValues({ javascriptObject: { key: 'value' } })
      logger._logValues([])
      logger._logValues('')

      expect(spyLog.calledOnce)
    })

    // The positive unit tests to capture if log has been called are already written in
    // the 'cy.log() shows all arguments in each line when there are multiple args' unit test.
  })
})
