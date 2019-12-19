import sinon from 'sinon'
import Hook from './hook-model'

import CommandModel from '../commands/command-model'
import ErrModel from '../lib/err-model'

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
      const command1: Partial<CommandModel> = { isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as CommandModel)

      expect(hook.commands.length).to.equal(1)

      const command2: Partial<CommandModel> = {}

      hook.addCommand(command2 as CommandModel)
      expect(hook.commands.length).to.equal(2)
    })

    it('numbers commands incrementally when not events', () => {
      const command1: Partial<CommandModel> = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as CommandModel)
      expect(command1.number).to.equal(1)

      const command2: Partial<CommandModel> = { event: false }

      hook.addCommand(command2 as CommandModel)
      expect(command2.number).to.equal(2)
    })

    it('does not number event commands', () => {
      const command1: Partial<CommandModel> = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1 as CommandModel)
      expect(command1.number).to.equal(1)

      const command2: Partial<CommandModel> = { event: true, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command2 as CommandModel)
      expect(command2.number).to.be.undefined

      const command3: Partial<CommandModel> = { event: false }

      hook.addCommand(command3 as CommandModel)
      expect(command3.number).to.equal(2)
    })

    it('adds command as duplicate if it matches the last command', () => {
      const addDuplicate = sinon.spy()
      const command1: Partial<CommandModel> = { event: true, isMatchingEvent: () => {
        return true
      }, addDuplicate }

      hook.addCommand(command1 as CommandModel)

      const command2: Partial<CommandModel> = { event: true }

      hook.addCommand(command2 as CommandModel)

      expect(addDuplicate).to.be.calledWith(command2)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns last command to match the error', () => {
      const matchesButIsntLast: Partial<CommandModel> = {
        err: { displayMessage: 'matching error message' } as ErrModel,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(matchesButIsntLast as CommandModel)

      const doesntMatch: Partial<CommandModel> = {
        err: { displayMessage: 'other error message' } as ErrModel,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(doesntMatch as CommandModel)

      const matches: Partial<CommandModel> = {
        err: { displayMessage: 'matching error message' } as ErrModel,
      }

      hook.addCommand(matches as CommandModel)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' } as ErrModel)).to.eql(matches)
    })

    it('returns undefined when no match', () => {
      const noMatch1: Partial<CommandModel> = {
        err: { displayMessage: 'some error message' } as ErrModel,
        isMatchingEvent: () => {
          return false
        },
      }

      hook.addCommand(noMatch1 as CommandModel)

      const noMatch2: Partial<CommandModel> = {
        err: { displayMessage: 'other error message' } as ErrModel,
      }

      hook.addCommand(noMatch2 as CommandModel)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' } as ErrModel)).to.be.undefined
    })
  })

  context('#aliasesWithDuplicates', () => {
    const addCommand = (alias: string, hasDuplicates = false) => {
      const command: Partial<CommandModel> = {
        isMatchingEvent: () => {
          return false
        },
        alias,
        hasDuplicates,
      }

      return hook.addCommand(command as CommandModel)
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
