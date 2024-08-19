import { CDPCommandQueue, Command } from '../../../lib/browsers/cdp-command-queue'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import pDeferred from 'p-defer'
import _ from 'lodash'

const { expect } = require('../../spec_helper')

function matchCommand (search: Partial<Command<any>>) {
  return (predicate: Partial<Command<any>>) => {
    return _.isEqual(search.command, predicate.command) && _.isEqual(search.params, predicate.params)
  }
}

describe('CDPCommandQueue', () => {
  const enableAnimation: {
    command: 'Animation.enable'
    params: undefined
  } = { command: 'Animation.enable', params: undefined }
  const removeAttribute: {
    command: 'DOM.removeAttribute'
    params: ProtocolMapping.Commands['DOM.removeAttribute']['paramsType'][0]
  } = { command: 'DOM.removeAttribute', params: { name: 'attribute', nodeId: 123 } }

  describe('.entries', () => {
    describe('when an entry is added', () => {
      let queue: CDPCommandQueue

      beforeEach(() => {
        queue = new CDPCommandQueue()
        queue.add(enableAnimation.command, enableAnimation.params)
      })

      it('reflects only the entry that was added', () => {
        expect(queue.entries.find(matchCommand(enableAnimation)), 'queue should contain enableAnimation').not.to.be.undefined
        expect(queue.entries.length).to.eq(1)
      })

      describe('and another is added', () => {
        beforeEach(() => {
          queue.add(removeAttribute.command, removeAttribute.params)
        })

        it('reflects only the entries that have been added', () => {
          expect(queue.entries.find(matchCommand(enableAnimation))).not.to.be.undefined
          expect(queue.entries.find(matchCommand(removeAttribute))).not.to.be.undefined
          expect(queue.entries).to.have.lengthOf(2)
        })
      })

      describe('and the is cleared', () => {
        beforeEach(() => {
          queue.clear()
        })

        it('has no entries', () => {
          expect(queue.entries.find(matchCommand(enableAnimation))).to.be.undefined
          expect(queue.entries).to.have.lengthOf(0)
        })
      })
    })
  })

  describe('.add', () => {
    it('adds a command to the queue and returns a promise that is resolved when the command is resolved', () => {
      const sessionId = '1234'
      const queue = new CDPCommandQueue()

      const commandPromise = queue.add(enableAnimation.command, enableAnimation.params, sessionId)
      const enqueued = queue.entries[0]

      expect(enqueued.command).to.eq(enableAnimation.command)
      expect(_.isEqual(enqueued.params, enableAnimation.params), 'params are preserved').to.be.true
      expect(enqueued.sessionId).to.eq(sessionId)
      expect(enqueued.deferred).not.to.be.undefined

      const resolution = { value: true }

      enqueued.deferred.resolve(resolution)
      expect(commandPromise).to.eventually.equal(resolution)
    })
  })

  describe('.clear', () => {
    it('clears the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      queue.add(removeAttribute.command, removeAttribute.params)
      expect(queue.entries).to.have.lengthOf(2)
      queue.clear()
      expect(queue.entries).to.have.lengthOf(0)
    })
  })

  describe('.extract', () => {
    let queue: CDPCommandQueue
    let searchCommand: Partial<Command<any>>
    let addCommand: Partial<Command<any>>

    beforeEach(() => {
      queue = new CDPCommandQueue()
    })

    describe('when the given search predicate exists in the queue', () => {
      beforeEach(() => {
        searchCommand = enableAnimation
        addCommand = enableAnimation
      })

      it('returns the matching enqueued command, and removes it from the queue', () => {
        queue.add(addCommand.command, addCommand.params)
        const found = queue.extract(searchCommand)

        expect(found.command).to.eq(searchCommand.command)
        expect(found.params).to.eq(searchCommand.params)
        expect(queue.entries).to.have.lengthOf(0)
      })
    })

    describe('when the given search predicate does not exist in the queue', () => {
      beforeEach(() => {
        addCommand = removeAttribute
        searchCommand = enableAnimation
      })

      it('returns undefined, and does not modify the queue', () => {
        queue.add(addCommand.command, addCommand.params)
        expect(queue.entries).to.have.lengthOf(1)
        const found = queue.extract(searchCommand)

        expect(found).to.be.undefined
        expect(queue.entries).to.have.lengthOf(1)
      })
    })
  })

  describe('.shift', () => {
    it('removes and returns the entry from the beginning of the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      queue.add(removeAttribute.command, removeAttribute.params)
      const next = queue.shift()

      expect(next.command).to.eq(enableAnimation.command)
      expect(queue.entries).to.have.lengthOf(1)
    })
  })

  describe('.unshift', () => {
    it('adds an entry to the front of the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      const deferred = pDeferred()

      queue.unshift({
        command: enableAnimation.command,
        deferred,
      })
    })
  })
})
