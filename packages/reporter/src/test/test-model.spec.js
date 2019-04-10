import sinon from 'sinon'

import Test from './test-model'

describe('Test model', () => {
  context('.state', () => {
    it('is processing when there are no attempts', () => {
      const test = new Test({})

      expect(test.state).to.equal('processing')
    })

    it('is the last attempt\'s state when there are attempts', () => {
      const test = new Test({ state: 'passed' })

      expect(test.state).to.equal('passed')
    })
  })

  context('.isLongRunning', () => {
    it('is true if any attempt is long running', () => {
      const test = new Test({})

      test.attempts = [{ isLongRunning: false }, { isLongRunning: true }]

      expect(test.isLongRunning).to.be.true
    })

    it('is false if no attempt is long running', () => {
      const test = new Test({})

      test.attempts = [{ isLongRunning: false }, { isLongRunning: false }]

      expect(test.isLongRunning).to.be.false
    })
  })

  context('#addLog', () => {
    it('adds the log to the attempt', () => {
      const test = new Test({ _currentRetry: 0 })
      const props = { testCurrentRetry: 0 }
      const attempt = test.getAttemptByIndex(0)

      sinon.stub(attempt, 'addLog')
      test.addLog(props)
      expect(attempt.addLog).to.be.calledWith(props)
    })
  })

  context('#start', () => {
    it('starts the appropriate attempt if it exists', () => {
      const test = new Test({ _currentRetry: 2, prevAttempts: [{ _currentRetry: 0 }, { _currentRetry: 1 }] })

      test.start({ _currentRetry: 2 })
      expect(test.getAttemptByIndex(2).isActive).to.be.true
    })

    it('creates and starts a new attempt if it does not exist', () => {
      const test = new Test({})

      test.start({ _currentRetry: 1 })
      expect(test.getAttemptByIndex(1).isActive).to.be.true
    })
  })

  context('#finish', () => {
    it('finishes the attempt', () => {
      const test = new Test({ _currentRetry: 0 })
      const attempt = test.getAttemptByIndex(0)
      const props = { _currentRetry: 0 }

      sinon.stub(attempt, 'finish')

      test.finish(props)
      expect(attempt.finish).to.be.calledWith(props)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns command of the last attempt matching the error', () => {
      const test = new Test({ _currentRetry: 0 })
      const attempt = test.getAttemptByIndex(0)
      const command = {}

      sinon.stub(attempt, 'commandMatchingErr').returns(command)

      expect(test.commandMatchingErr()).to.equal(command)
    })
  })
})
