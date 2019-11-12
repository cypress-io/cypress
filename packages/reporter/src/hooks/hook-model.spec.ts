import sinon from 'sinon'
import Hook from './hook-model'

import Command from '../commands/command-model'
import Err from '../lib/err-model'

describe('Hook model', () => {
  let hook: Hook

  beforeEach(() => {
    hook = new Hook({ name: 'before' })
  })

  it('gives hooks unique ids', () => {
    const anotherHook = new Hook({ name: 'test' })

    expect(hook.id).not.to.equal(anotherHook.id)
  })

  context('#addCommand', () => {
    it('adds the command to its command collection', () => {
      const command1: Partial<Command> = { isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as Command)

      expect(hook.commands.length).to.equal(1)

      const command2: Partial<Command> = {}

      hook.addCommand(command2 as Command)
      expect(hook.commands.length).to.equal(2)
    })

    it('numbers commands incrementally when not events', () => {
      const command1: Partial<Command> = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as Command)
      expect(command1.number).to.equal(1)

      const command2: Partial<Command> = { event: false }

      hook.addCommand(command2 as Command)
      expect(command2.number).to.equal(2)
    })

    it('does not number event commands', () => {
      const command1: Partial<Command> = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as Command)
      expect(command1.number).to.equal(1)

      const command2: Partial<Command> = { event: true, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command2 as Command)
      expect(command2.number).to.be.undefined

      const command3: Partial<Command> = { event: false }

      hook.addCommand(command3 as Command)
      expect(command3.number).to.equal(2)
    })

    it('adds command as duplicate if it matches the last command', () => {
      const addDuplicate = sinon.spy()
      const command1: Partial<Command> = { event: true, isMatchingEvent: () => {
        return true
      }, addDuplicate }

      hook.addCommand(command1 as Command)

      const command2: Partial<Command> = { event: true }

      hook.addCommand(command2 as Command)

      expect(addDuplicate).to.be.calledWith(command2)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns last command to match the error', () => {
      const matchesButIsntLast: Partial<Command> = {
        err: { displayMessage: 'matching error message' } as Err,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(matchesButIsntLast as Command)

      const doesntMatch: Partial<Command> = {
        err: { displayMessage: 'other error message' } as Err,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(doesntMatch as Command)

      const matches: Partial<Command> = {
        err: { displayMessage: 'matching error message' } as Err,
      }

      hook.addCommand(matches as Command)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' } as Err)).to.eql(matches)
    })

    it('returns undefined when no match', () => {
      const noMatch1: Partial<Command> = {
        err: { displayMessage: 'some error message' } as Err,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(noMatch1 as Command)

      const noMatch2: Partial<Command> = {
        err: { displayMessage: 'other error message' } as Err,
      }

      hook.addCommand(noMatch2 as Command)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' } as Err)).to.be.undefined
    })
  })

  context('#aliasesWithDuplicates', () => {
    const addCommand = (alias: string, hasDuplicates = false) => {
      const command: Partial<Command> = {
        isMatchingEvent: () => {
          return false
        },
        alias,
        hasDuplicates,
      }

      return hook.addCommand(command as Command)
    }

    it('returns duplicates marked with hasDuplicates and those that appear mulitple times in the commands array', () => {
      addCommand('foo')
      addCommand('bar')
      addCommand('foo')
      addCommand('baz', true)

      expect(hook.aliasesWithDuplicates).to.include('foo')
      expect(hook.aliasesWithDuplicates).to.include('baz')
      expect(hook.aliasesWithDuplicates).to.not.include('bar')
    })

    // https://github.com/cypress-io/cypress/issues/4411
    it('returns the same array instance if it has not changed', () => {
      let dupes = hook.aliasesWithDuplicates

      addCommand('foo')
      expect(dupes).to.deep.eq([])

      addCommand('bar')
      expect(hook.aliasesWithDuplicates === dupes).to.be.true

      addCommand('foo')
      dupes = hook.aliasesWithDuplicates
      expect(dupes).to.deep.eq(['foo'])

      addCommand('foo')
      expect(hook.aliasesWithDuplicates === dupes).to.be.true
    })
  })
})
