import { HookProps } from '../hooks/hook-model'
import Command, { CommandProps } from '../commands/command-model'
import Agent from '../agents/agent-model'
import Route from '../routes/route-model'
import Err from '../errors/err-model'

import TestModel, { TestProps } from './test-model'

const commandHook: (hookId: string) => Partial<Command> = (hookId: string) => {
  return {
    hookId,
    isMatchingEvent: () => {
      return false
    },
  }
}

describe('Test model', () => {
  context('.state', () => {
    it('is the "state" when it exists', () => {
      const test = new TestModel({ id: 1, state: 'passed' } as TestProps, 0)

      expect(test.state).to.equal('passed')
    })

    it('is active when there is no state and isActive is true', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.isActive = true
      expect(test.state).to.equal('active')
    })

    it('is processing when there is no state and isActive is falsey', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      expect(test.state).to.equal('processing')
    })
  })

  context('.isLongRunning', () => {
    it('start out not long running', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      expect(test.isLongRunning).to.be.false
    })

    it('is not long running if active but without a long running command', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.start()
      expect(test.isLongRunning).to.be.false
    })

    it('becomes long running if active and has a long running command', () => {
      const test = new TestModel({ id: 1, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.start()
      test.addCommand({ isLongRunning: true, hookId: 'h1' } as Command)
      expect(test.isLongRunning).to.be.true
    })

    it('becomes not long running if it becomes inactive', () => {
      const test = new TestModel({ id: 1, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.start()
      test.addCommand({ isLongRunning: true, hookId: 'h1' } as Command)
      test.finish({})
      expect(test.isLongRunning).to.be.false
    })
  })

  context('#addAgent', () => {
    it('adds the agent to the agents collection', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.addAgent({} as Agent)
      expect(test.agents.length).to.equal(1)
    })
  })

  context('#addRoute', () => {
    it('adds the route to the routes collection', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.addRoute({} as Route)
      expect(test.routes.length).to.equal(1)
    })
  })

  context('#addCommand', () => {
    it('adds the command to the commands collection', () => {
      const test = new TestModel({ id: 1, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.addCommand({ hookId: 'h1' } as Command)
      expect(test.commands.length).to.equal(1)
    })

    it('adds the command to the correct hook', () => {
      const test = new TestModel({
        id: 1,
        hooks: [
          { hookId: 'h1' } as HookProps,
          { hookId: 'h2' } as HookProps,
        ],
      } as TestProps, 0)

      test.addCommand(commandHook('h1') as Command)
      expect(test.hooks[0].commands.length).to.equal(1)
      expect(test.hooks[1].commands.length).to.equal(0)
      expect(test.hooks[2].commands.length).to.equal(0)

      test.addCommand(commandHook('1') as Command)
      expect(test.hooks[0].commands.length).to.equal(1)
      expect(test.hooks[1].commands.length).to.equal(1)
      expect(test.hooks[2].commands.length).to.equal(0)
    })

    it('moves hooks into the correct order', () => {
      const test = new TestModel({
        id: 1,
        hooks: [
          { hookId: 'h1' } as HookProps,
          { hookId: 'h2' } as HookProps,
        ],
      } as TestProps, 0)

      test.addCommand(commandHook('h2') as Command)
      expect(test.hooks[0].hookId).to.equal('h2')
      expect(test.hooks[0].invocationOrder).to.equal(0)
      expect(test.hooks[0].commands.length).to.equal(1)

      test.addCommand(commandHook('h1') as Command)
      expect(test.hooks[1].hookId).to.equal('h1')
      expect(test.hooks[1].invocationOrder).to.equal(1)
      expect(test.hooks[1].commands.length).to.equal(1)
    })

    it('counts and assigns the number of each hook type', () => {
      const test = new TestModel({
        id: 1,
        hooks: [
          { hookId: 'h1', hookName: 'before each' } as HookProps,
          { hookId: 'h2', hookName: 'after each' } as HookProps,
          { hookId: 'h3', hookName: 'before each' } as HookProps,
        ],
      } as TestProps, 0)

      test.addCommand(commandHook('h1') as Command)
      expect(test.hookCount['before each']).to.equal(1)
      expect(test.hookCount['after each']).to.equal(0)
      expect(test.hooks[0].hookNumber).to.equal(1)

      test.addCommand(commandHook('h1') as Command)
      expect(test.hookCount['before each']).to.equal(1)
      expect(test.hookCount['after each']).to.equal(0)
      expect(test.hooks[0].hookNumber).to.equal(1)

      test.addCommand(commandHook('h3') as Command)
      expect(test.hookCount['before each']).to.equal(2)
      expect(test.hookCount['after each']).to.equal(0)
      expect(test.hooks[1].hookNumber).to.equal(2)

      test.addCommand(commandHook('h2') as Command)
      expect(test.hookCount['before each']).to.equal(2)
      expect(test.hookCount['after each']).to.equal(1)
      expect(test.hooks[2].hookNumber).to.equal(1)
    })
  })

  context('#start', () => {
    it('sets the test as active', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.start()
      expect(test.isActive).to.be.true
    })
  })

  context('#finish', () => {
    it('sets the test as inactive', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.finish({})
      expect(test.isActive).to.be.false
    })

    it('updates the state of the test', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.finish({ state: 'failed' })
      expect(test.state).to.equal('failed')
    })

    it('updates the test err', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      test.finish({ err: { name: 'SomeError' } as Err })
      expect(test.err.name).to.equal('SomeError')
    })

    it('sets the hook to failed if it exists', () => {
      const test = new TestModel({ id: 1, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.addCommand({ hookId: 'h1' } as Command)
      test.finish({ hookId: 'h1' })
      expect(test.hooks[0].failed).to.be.true
    })

    it('does not throw error if hook does not exist', () => {
      const test = new TestModel({ id: 1 } as TestProps, 0)

      expect(() => {
        test.finish({ hookId: 'h1' })
      }).not.to.throw()
    })
  })

  context('#commandMatchingErr', () => {
    it('returns last command matching the error', () => {
      const test = new TestModel({ id: 1, err: { message: 'SomeError' } as Err, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.addCommand(new Command({ err: { message: 'SomeError' } as Err, hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ err: {} as Err, hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ err: { message: 'SomeError' } as Err, hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ err: {} as Err, hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ name: 'The One', err: { message: 'SomeError' } as Err, hookId: 'h1' } as CommandProps))
      expect(test.commandMatchingErr()!.name).to.equal('The One')
    })

    it('returns undefined if there are no commands with errors', () => {
      const test = new TestModel({ id: 1, err: { message: 'SomeError' } as Err, hooks: [{ hookId: 'h1' } as HookProps] } as TestProps, 0)

      test.addCommand(new Command({ hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ hookId: 'h1' } as CommandProps))
      test.addCommand(new Command({ hookId: 'h1' } as CommandProps))
      expect(test.commandMatchingErr()).to.be.undefined
    })
  })
})
