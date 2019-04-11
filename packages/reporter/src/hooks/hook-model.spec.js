import sinon from 'sinon'
import Hook from './hook-model'

describe('Hook model', () => {
  let hook

  beforeEach(() => {
    hook = new Hook({ name: 'before' })
  })

  it('gives hooks unique ids', () => {
    const anotherHook = new Hook({ name: 'test' })

    expect(hook.id).not.to.equal(anotherHook.id)
  })

  context('#addCommand', () => {
    it('adds the command to its command collection', () => {
      hook.addCommand({ isMatchingEvent: () => {
        return false
      } })
      expect(hook.commands.length).to.equal(1)
      hook.addCommand({})
      expect(hook.commands.length).to.equal(2)
    })

    it('numbers commands incrementally when not events', () => {
      const command1 = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1)
      expect(command1.number).to.equal(1)

      const command2 = { event: false }

      hook.addCommand(command2)
      expect(command2.number).to.equal(2)
    })

    it('does not number event commands', () => {
      const command1 = { event: false, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command1)
      expect(command1.number).to.equal(1)

      const command2 = { event: true, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(command2)
      expect(command2.number).to.be.undefined

      const command3 = { event: false }

      hook.addCommand(command3)
      expect(command3.number).to.equal(2)
    })

    it('adds command as duplicate if it matches the last command', () => {
      const addDuplicate = sinon.spy()
      const command1 = { event: true, isMatchingEvent: () => {
        return true
      }, addDuplicate }

      hook.addCommand(command1)

      const command2 = { event: true }

      hook.addCommand(command2)

      expect(addDuplicate).to.be.calledWith(command2)
    })
  })

  context('#commandMatchingErr', () => {
    it('returns last command to match the error', () => {
      const matchesButIsntLast = { err: { displayMessage: 'matching error message' }, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(matchesButIsntLast)
      const doesntMatch = { err: { displayMessage: 'other error message' }, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(doesntMatch)
      const matches = { err: { displayMessage: 'matching error message' } }

      hook.addCommand(matches)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' })).to.eql(matches)
    })

    it('returns undefined when no match', () => {
      const noMatch1 = { err: { displayMessage: 'some error message' }, isMatchingEvent: () => {
        return false
      } }

      hook.addCommand(noMatch1)
      const noMatch2 = { err: { displayMessage: 'other error message' } }

      hook.addCommand(noMatch2)

      expect(hook.commandMatchingErr({ displayMessage: 'matching error message' })).to.be.undefined
    })
  })

  context('#aliasesWithDuplicates', () => {
    it('returns duplicates marked with hasDuplicates and those that appear mulitple times in the commands array', () => {
      hook.addCommand({ isMatchingEvent: () => {
        return false
      }, alias: 'foo' })
      hook.addCommand({ isMatchingEvent: () => {
        return false
      }, alias: 'bar' })
      hook.addCommand({ isMatchingEvent: () => {
        return false
      }, alias: 'foo' })
      hook.addCommand({ isMatchingEvent: () => {
        return false
      }, alias: 'baz', hasDuplicates: true })

      expect(hook.aliasesWithDuplicates).to.include('foo')
      expect(hook.aliasesWithDuplicates).to.include('baz')
      expect(hook.aliasesWithDuplicates).to.not.include('bar')
    })
  })
})
