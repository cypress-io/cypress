import Command, { CommandProps } from '../commands/command-model'
import Err from '../errors/err-model'
import sinon from 'sinon'

import TestModel, { TestProps } from './test-model'

describe('Test model', () => {
  context('.state', () => {
    it('is processing when there are no attempts', () => {
      const test = new TestModel({})

      expect(test.state).to.equal('processing')
    })

    it('is the last attempt\'s state when there are attempts', () => {
      const test = new TestModel({ state: 'passed' })

      expect(test.state).to.equal('passed')
    })
  })

  context('.isOpen', () => {
    it('is open when failed', () => {
      const test = new TestModel({ state: 'failed' })

      expect(test.isOpen).eq(true)
    })

    it('is open when long running', () => {
      const test = new TestModel({})

      test.attempts = [{ isLongRunning: true }]

      expect(test.isOpen).eq(true)
    })

    it('is open when is the single test', () => {
      const test = new TestModel({}, null, { hasSingleTest: true })

      expect(test.isOpen).eq(true)
    })

    it('can be toggled from closed to open', () => {
      const test = new TestModel({})

      test.toggleOpen()

      expect(test.isOpen).eq(true)
    })

    it('can be toggled from open to closed', () => {
      const test = new TestModel({ state: 'failed' })

      test.toggleOpen()

      expect(test.isOpen).eq(false)
    })
  })

  context('.isLongRunning', () => {
    it('is true if any attempt is long running', () => {
      const test = new TestModel({})

      test.attempts = [{ isLongRunning: false }, { isLongRunning: true }]

      expect(test.isLongRunning).to.be.true
    })

    it('is false if no attempt is long running', () => {
      const test = new TestModel({})

      test.attempts = [{ isLongRunning: false }, { isLongRunning: false }]
    })
  })

  context('#start', () => {
    it('sets the test as active', () => {
      const test = new TestModel({} as TestProps, 0)

      expect(test.isLongRunning).to.be.false
    })
  })

  context('#addLog', () => {
    it('adds the log to the attempt', () => {
      const test = new TestModel({ _currentRetry: 0 })
      const props = { testCurrentRetry: 0 }
      const attempt = test.getAttemptByIndex(0)

      sinon.stub(attempt, 'addLog')
      test.addLog(props)
      expect(attempt.addLog).to.be.calledWith(props)
    })
  })

  context('#start', () => {
    it('starts the appropriate attempt if it exists', () => {
      const test = new TestModel({ _currentRetry: 2, prevAttempts: [{ _currentRetry: 0 }, { _currentRetry: 1 }] })

      test.start({ _currentRetry: 2 })
      expect(test.getAttemptByIndex(2).isActive).to.be.true
    })

    it('creates and starts a new attempt if it does not exist', () => {
      const test = new TestModel({})

      test.start({ _currentRetry: 1 })
      expect(test.getAttemptByIndex(1).isActive).to.be.true
    })
  })

  context('#finish', () => {
    it('finishes the attempt', () => {
      const test = new TestModel({ _currentRetry: 0 })
      const attempt = test.getAttemptByIndex(0)
      const props = { _currentRetry: 0 }

      sinon.stub(attempt, 'finish')

      test.finish(props)
      expect(attempt.finish).to.be.calledWith(props)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns command of the last attempt matching the error', () => {
      const test = new TestModel({ _currentRetry: 0 })
      const attempt = test.getAttemptByIndex(0)
      const command = {}

      sinon.stub(attempt, 'commandMatchingErr').returns(command)
      expect(test.commandMatchingErr()).to.equal(command)
    })

    it('returns last command matching the error', () => {
      const test = new TestModel({ err: { message: 'SomeError' } as Err } as TestProps, 0)

      test.addCommand(new Command({ err: { message: 'SomeError' } as Err } as CommandProps), 'some hook')
      test.addCommand(new Command({ err: {} as Err } as CommandProps), 'some hook')
      test.addCommand(new Command({ err: { message: 'SomeError' } as Err } as CommandProps), 'some hook')
      test.addCommand(new Command({ err: {} as Err } as CommandProps), 'another hook')
      test.addCommand(new Command({ name: 'The One', err: { message: 'SomeError' } as Err } as CommandProps), 'another hook')
      expect(test.commandMatchingErr()!.name).to.equal('The One')
    })

    it('returns undefined if there are no commands with errors', () => {
      const test = new TestModel({ err: { message: 'SomeError' } as Err } as TestProps, 0)

      expect(test.commandMatchingErr()).eq(undefined)
    })
  })
})
