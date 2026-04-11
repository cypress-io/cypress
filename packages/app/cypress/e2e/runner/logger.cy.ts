import sinon from 'sinon'
import { logger } from '../../../src/runner/logger'

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

  it('cy.log() logs groups correctly', () => {
    logger.logFormatted({ groups: [{ name: 'test', items: { 'key1': 'value1', 'longerkey2': 'value2' } }] })

    expect(spyLog).to.have.been.calledWith(`%cKey1:       `, 'color: #4a90e2', 'value1')
    expect(spyLog).to.have.been.calledWith(`%cLongerkey2: `, 'color: #4a90e2', 'value2')
  })

  it('ensures a fresh set of logs each time logger.logFormatted() is called', () => {
    const props = { groups: [{ name: 'test', items: { 'key1': 'value1', 'longerkey2': 'value2' } }] }

    logger.logFormatted(props)

    expect(spyLog).to.have.been.calledWith(`%cKey1:       `, 'color: #4a90e2', 'value1')
    expect(spyLog).to.have.been.calledWith(`%cLongerkey2: `, 'color: #4a90e2', 'value2')

    spyLog.resetHistory()

    logger.logFormatted(props)

    expect(spyLog).to.have.been.calledWith(`%cKey1:       `, 'color: #4a90e2', 'value1')
    expect(spyLog).to.have.been.calledWith(`%cLongerkey2: `, 'color: #4a90e2', 'value2')
  })

  describe('_logValues', () => {
    it('should not call log for empty/nullish values', () => {
      logger._logValues({})
      logger._logValues({ test: {} })
      logger._logValues(null)
      logger._logValues(undefined)

      // When consoleProps is empty or only has object values,
      // log should not be called with string trim checks
      expect(spyLog.getCalls().filter((call) => {
        const value = call.args[2]

        return typeof value === 'string' && value.trim() === ''
      })).to.have.length(0)
    })

    // The positive unit tests to capture if log has been called are already written in
    // the 'cy.log() shows all arguments in each line when there are multiple args' unit test.
  })
})
