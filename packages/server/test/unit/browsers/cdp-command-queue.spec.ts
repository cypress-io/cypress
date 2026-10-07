import type { Command } from '../../../lib/browsers/cdp-protocol/cdp-command-queue'
import { CDPCommandQueue } from '../../../lib/browsers/cdp-protocol/cdp-command-queue'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import _ from 'lodash'
import { beforeEach, describe, expect, it } from 'vitest'

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
        expect(queue.entries.find(matchCommand(enableAnimation)), 'queue should contain enableAnimation').not.toBeUndefined()
        expect(queue.entries).toHaveLength(1)
      })

      describe('and another is added', () => {
        beforeEach(() => {
          queue.add(removeAttribute.command, removeAttribute.params)
        })

        it('reflects only the entries that have been added', () => {
          expect(queue.entries.find(matchCommand(enableAnimation))).not.toBeUndefined()
          expect(queue.entries.find(matchCommand(removeAttribute))).not.toBeUndefined()
          expect(queue.entries).toHaveLength(2)
        })
      })

      describe('and the is cleared', () => {
        beforeEach(() => {
          queue.clear()
        })

        it('has no entries', () => {
          expect(queue.entries.find(matchCommand(enableAnimation))).toBeUndefined()
          expect(queue.entries).toHaveLength(0)
        })
      })
    })
  })

  describe('.add', () => {
    it('adds a command to the queue and returns a promise that is resolved when the command is resolved', async () => {
      const sessionId = '1234'
      const queue = new CDPCommandQueue()

      const commandPromise = queue.add(enableAnimation.command, enableAnimation.params, sessionId)
      const enqueued = queue.entries[0]

      expect(enqueued.command).toBe(enableAnimation.command)
      expect(_.isEqual(enqueued.params, enableAnimation.params), 'params are preserved').toBe(true)
      expect(enqueued.sessionId).toBe(sessionId)
      expect(enqueued.deferred).not.toBeUndefined()

      const resolution = { value: true }

      enqueued.deferred.resolve(resolution)
      await expect(commandPromise).resolves.toBe(resolution)
    })
  })

  describe('.clear', () => {
    it('clears the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      queue.add(removeAttribute.command, removeAttribute.params)
      expect(queue.entries).toHaveLength(2)
      queue.clear()
      expect(queue.entries).toHaveLength(0)
    })
  })

  describe('.reject', () => {
    it('rejects every enqueued command promise and empties the queue', async () => {
      const queue = new CDPCommandQueue()

      const first = queue.add(enableAnimation.command, enableAnimation.params)
      const second = queue.add(removeAttribute.command, removeAttribute.params)
      const err = new Error('connection closed')

      queue.reject(err)

      expect(queue.entries).toHaveLength(0)
      await expect(first).rejects.toBe(err)
      await expect(second).rejects.toBe(err)
    })

    it('does not affect commands added after the rejection', async () => {
      const queue = new CDPCommandQueue()

      const beforeReject = queue.add(enableAnimation.command, enableAnimation.params)

      queue.reject(new Error('connection closed'))
      await expect(beforeReject).rejects.toThrow('connection closed')

      const afterReject = queue.add(removeAttribute.command, removeAttribute.params)

      expect(queue.entries).toHaveLength(1)
      queue.entries[0].deferred.resolve({ value: true })
      await expect(afterReject).resolves.toEqual({ value: true })
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

        expect(found.command).toBe(searchCommand.command)
        expect(found.params).toBe(searchCommand.params)
        expect(queue.entries).toHaveLength(0)
      })
    })

    describe('when the given search predicate does not exist in the queue', () => {
      beforeEach(() => {
        addCommand = removeAttribute
        searchCommand = enableAnimation
      })

      it('returns undefined, and does not modify the queue', () => {
        queue.add(addCommand.command, addCommand.params)
        expect(queue.entries).toHaveLength(1)
        const found = queue.extract(searchCommand)

        expect(found).toBeUndefined()
        expect(queue.entries).toHaveLength(1)
      })
    })
  })

  describe('.shift', () => {
    it('removes and returns the entry from the beginning of the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      queue.add(removeAttribute.command, removeAttribute.params)
      const next = queue.shift()

      expect(next.command).toBe(enableAnimation.command)
      expect(queue.entries).toHaveLength(1)
    })
  })

  describe('.unshift', () => {
    it('adds an entry to the front of the queue', () => {
      const queue = new CDPCommandQueue()

      queue.add(enableAnimation.command, enableAnimation.params)
      const deferred = Promise.withResolvers()

      queue.unshift({
        command: enableAnimation.command,
        deferred,
      })
    })
  })
})
