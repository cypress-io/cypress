import sinon from 'sinon'

import Test from './test-model'

describe('Test model', () => {
  context('.state', () => {
    it('is active when there are no attempts', () => {
      const test = new Test({})

      expect(test.state).to.equal('active')
    })

    it('is the last attempt\'s state when there are attempts', () => {
      const test = new Test({ attempts: [{ attemptIndex: 1, state: 'passed' }] })

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
      const test = new Test({ attemptIndex: 0 })
      const props = { attemptIndex: 0 }
      const attempt = test.getAttemptByIndex(0)

      sinon.stub(attempt, 'addLog')
      test.addLog(props)
      expect(attempt.addLog).to.be.calledWith(props)
    })
  })

  context('#start', () => {
    it('starts the appropriate attempt if it exists', () => {
      const test = new Test({ attempts: [{ attemptIndex: 1 }, { attempt: 2 }] })

      test.start({ attempt: 2 })
      expect(test.getAttemptByIndex(2).isActive).to.be.true
    })

    it('creates and starts a new attempt if it does not exist', () => {
      const test = new Test({})

      test.start({ attemptIndex: 1 })
      expect(test.getAttemptByIndex(1).isActive).to.be.true
    })
  })

  context('#finish', () => {
    it('finishes the attempt', () => {
      const test = new Test({ attempts: [{ attemptIndex: 1 }] })
      const attempt = test.getAttemptByIndex(1)
      const props = { attemptIndex: 1 }

      sinon.stub(attempt, 'finish')

      test.finish(props)
      expect(attempt.finish).to.be.calledWith(props)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns command of the last attempt matching the error', () => {
      const test = new Test({ attempts: [{ attemptIndex: 1 }] })
      const attempt = test.getAttemptByIndex(1)
      const command = {}

      sinon.stub(attempt, 'commandMatchingErr').returns(command)

      expect(test.commandMatchingErr()).to.equal(command)
    })
  })
})
