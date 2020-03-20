import Command, { CommandProps } from '../commands/command-model'
import Agent from '../agents/agent-model'
import Route from '../routes/route-model'
import Err from '../errors/err-model'

import TestModel, { TestProps } from './test-model'

describe('Test model', () => {
  context('.state', () => {
    it('is the "state" when it exists', () => {
      const test = new TestModel({ state: 'passed' } as TestProps, 0)

      expect(test.state).to.equal('passed')
    })

    it('is active when there is no state and isActive is true', () => {
      const test = new TestModel({} as TestProps, 0)

      test.isActive = true
      expect(test.state).to.equal('active')
    })

    it('is processing when there is no state and isActive is falsey', () => {
      const test = new TestModel({} as TestProps, 0)

      expect(test.state).to.equal('processing')
    })
  })

  context('.isLongRunning', () => {
    it('start out not long running', () => {
      const test = new TestModel({} as TestProps, 0)

      expect(test.isLongRunning).to.be.false
    })

    it('is not long running if active but without a long running command', () => {
      const test = new TestModel({} as TestProps, 0)

      test.start()
      expect(test.isLongRunning).to.be.false
    })

    it('becomes long running if active and has a long running command', () => {
      const test = new TestModel({} as TestProps, 0)

      test.start()
      test.addCommand({ isLongRunning: true } as Command, '')
      expect(test.isLongRunning).to.be.true
    })

    it('becomes not long running if it becomes inactive', () => {
      const test = new TestModel({} as TestProps, 0)

      test.start()
      test.addCommand({ isLongRunning: true } as Command, '')
      test.finish({})
      expect(test.isLongRunning).to.be.false
    })
  })

  context('#addAgent', () => {
    it('adds the agent to the agents collection', () => {
      const test = new TestModel({} as TestProps, 0)

      test.addAgent({} as Agent)
      expect(test.agents.length).to.equal(1)
    })
  })

  context('#addRoute', () => {
    it('adds the route to the routes collection', () => {
      const test = new TestModel({} as TestProps, 0)

      test.addRoute({} as Route)
      expect(test.routes.length).to.equal(1)
    })
  })

  context('#addCommand', () => {
    it('adds the command to the commands collection', () => {
      const test = new TestModel({} as TestProps, 0)

      test.addCommand({} as Command, '')
      expect(test.commands.length).to.equal(1)
    })

    it('creates a hook and adds the command to it if it does not exist', () => {
      const test = new TestModel({} as TestProps, 0)

      test.addCommand({} as Command, 'some hook')
      expect(test.hooks.length).to.equal(1)
      expect(test.hooks[0].commands.length).to.equal(1)
    })

    it('adds the command to an existing hook if it already exists', () => {
      const test = new TestModel({} as TestProps, 0)
      const command: Partial<Command> = { isMatchingEvent: () => {
        return false
      } }

      test.addCommand(command as Command, 'some hook')

      expect(test.hooks.length).to.equal(1)
      expect(test.hooks[0].commands.length).to.equal(1)
      test.addCommand({} as Command, 'some hook')
      expect(test.hooks.length).to.equal(1)
      expect(test.hooks[0].commands.length).to.equal(2)
    })
  })

  context('#start', () => {
    it('sets the test as active', () => {
      const test = new TestModel({} as TestProps, 0)

      test.start()
      expect(test.isActive).to.be.true
    })
  })

  context('#finish', () => {
    it('sets the test as inactive', () => {
      const test = new TestModel({} as TestProps, 0)

      test.finish({})
      expect(test.isActive).to.be.false
    })

    it('updates the state of the test', () => {
      const test = new TestModel({} as TestProps, 0)

      test.finish({ state: 'failed' })
      expect(test.state).to.equal('failed')
    })

    it('updates the test err', () => {
      const test = new TestModel({} as TestProps, 0)

      test.finish({ err: { name: 'SomeError' } as Err })
      expect(test.err.name).to.equal('SomeError')
    })

    it('sets the hook to failed if it exists', () => {
      const test = new TestModel({} as TestProps, 0)

      test.addCommand({} as Command, 'some hook')
      test.finish({ hookName: 'some hook' })
      expect(test.hooks[0].failed).to.be.true
    })

    it('does not throw error if hook does not exist', () => {
      const test = new TestModel({} as TestProps, 0)

      expect(() => {
        test.finish({ hookName: 'some hook' })
      }).not.to.throw()
    })
  })

  context('#commandMatchingErr', () => {
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

      test.addCommand(new Command({} as CommandProps), 'some hook')
      test.addCommand(new Command({} as CommandProps), 'some hook')
      test.addCommand(new Command({} as CommandProps), 'another hook')
      expect(test.commandMatchingErr()).to.be.undefined
    })
  })
})
