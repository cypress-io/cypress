import _ from 'lodash'
import type { IStability } from '../../../src/cy/stability'
import $Command from '../../../src/cypress/command'
import { CommandQueue } from '../../../src/cypress/command_queue'
import type { StateFunc } from '../../../src/cypress/state'

const createCommand = (props = {}) => {
  return $Command.create(_.extend({
    name: 'get',
    args: ['#foo'],
    type: 'parent',
    chainerId: _.uniqueId('ch'),
    userInvocationStack: '',
    injected: false,
    fn () {},
  }, props))
}

const log = (props = {}) => {
  return Cypress.log(_.extend({
    name: _.uniqueId('l'),
  }, props))
}

describe('src/cypress/command_queue', () => {
  let queue
  const state = (() => {}) as StateFunc
  const timeout = () => {}
  const whenStable = {} as IStability
  const cleanup = () => 0
  const fail = () => {}
  const isCy = () => true
  const clearTimeout = () => {}

  beforeEach(() => {
    queue = new CommandQueue(state, timeout, whenStable, cleanup, fail, isCy, clearTimeout)

    queue.add(createCommand({
      name: 'get',
      logs: [log({ name: 'l1', alias: 'alias-1' }), log({ name: 'l2', alias: 'alias-1' })],
    }))

    queue.add(createCommand({
      name: 'find',
      logs: [log({ name: 'l3', alias: 'alias-2' })],
    }))

    queue.add(createCommand({
      name: 'click',
      logs: [log({ name: 'l4', alias: 'alias-1' }), log({ name: 'l5', alias: 'alias-3' })],
    }))
  })

  context('#logs', () => {
    it('returns a flat list of logs from the commands', () => {
      const logs = queue.logs()

      expect(_.invokeMap(logs, 'get', 'name')).to.eql(['l1', 'l2', 'l3', 'l4', 'l5'])
    })

    it('returns a filtered list of logs if filter is provided', () => {
      const logs = queue.logs({ alias: 'alias-1' })

      expect(_.invokeMap(logs, 'get', 'name')).to.eql(['l1', 'l2', 'l4'])
    })
  })

  context('#get', () => {
    it('returns list of commands', () => {
      const commands = queue.get()

      expect(_.invokeMap(commands, 'get', 'name')).to.eql(['get', 'find', 'click'])
    })
  })

  context('#names', () => {
    it('returns list of command names', () => {
      const names = queue.names()

      expect(names).to.eql(['get', 'find', 'click'])
    })
  })

  context('#insert', () => {
    it('inserts command into queue at index', () => {
      queue.insert(1, createCommand({ name: 'eq' }))

      expect(queue.names()).to.eql(['get', 'eq', 'find', 'click'])
    })

    it('returns the command', () => {
      const command = createCommand({ name: 'eq' })
      const result = queue.insert(1, command)

      expect(result).to.equal(command)
    })

    it('resets the next and prev commands', () => {
      const command = queue.insert(1, createCommand({ name: 'eq' }))
      const prev = queue.at(0)
      const next = queue.at(2)

      expect(command.get('prev')).to.equal(prev)
      expect(command.get('next')).to.equal(next)
      expect(prev.get('next')).to.equal(command)
      expect(next.get('prev')).to.equal(command)
    })

    it('works with start boundary index', () => {
      const command = queue.insert(0, createCommand({ name: 'eq' }))
      const next = queue.at(1)

      expect(queue.names()).to.eql(['eq', 'get', 'find', 'click'])
      expect(command.get('prev')).to.be.undefined
      expect(command.get('next')).to.equal(next)
      expect(next.get('prev')).to.equal(command)
    })

    it('works with end boundary index', () => {
      const command = queue.insert(3, createCommand({ name: 'eq' }))
      const prev = queue.at(2)

      expect(queue.names()).to.eql(['get', 'find', 'click', 'eq'])
      expect(command.get('prev')).to.equal(prev)
      expect(command.get('next')).to.be.undefined
      expect(prev.get('next')).to.equal(command)
    })
  })

  context('#slice', () => {
    it('returns commands from the index', () => {
      const commands = queue.slice(1)

      expect(_.invokeMap(commands, 'get', 'name')).to.eql(['find', 'click'])
    })
  })

  context('#at', () => {
    it('returns command at index', () => {
      const command = queue.at(1)

      expect(command.get('name')).to.equal('find')
    })
  })

  context('#find', () => {
    it('returns command that matches attributes', () => {
      const command = queue.find({ name: 'click' })

      expect(command.get('name')).to.equal('click')
    })
  })

  context('#reset', () => {
    it('resets the queue stopped state', () => {
      queue.reset()

      expect(queue.stopped).to.be.false
    })
  })

  context('#clear', () => {
    it('removes all commands from queue', () => {
      queue.stop()
      queue.clear()

      expect(queue.get().length).to.equal(0)
    })
  })

  context('#stop', () => {
    it('stops the queue', () => {
      queue.stop()

      expect(queue.stopped).to.be.true
    })
  })

  context('.length', () => {
    it('is the number of commands in the queue', () => {
      expect(queue.length).to.equal(3)
      queue.insert(0, createCommand({ name: 'eq' }))
      expect(queue.length).to.equal(4)
    })
  })

  context('.stopped', () => {
    it('is true when queue is stopped', () => {
      queue.stop()

      expect(queue.stopped).to.true
    })

    it('is false when queue is not stopped', () => {
      expect(queue.stopped).to.false
    })
  })
})
