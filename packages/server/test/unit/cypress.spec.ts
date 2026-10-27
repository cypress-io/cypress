import { createRequire } from 'module'
import { EventEmitter } from 'events'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cypress from '../../lib/cypress'

// `runElectron` reaches @packages/electron through a CJS `require`, which
// `vi.mock` never sees, so seed the CJS cache instead.
const requireCjs = createRequire(import.meta.url)
const electronPath = requireCjs.resolve('@packages/electron')
const electronMock = { open: vi.fn() }

requireCjs.cache[electronPath] = { exports: electronMock } as NodeModule

describe('lib/cypress', () => {
  describe('.runElectron when not already running in Electron', () => {
    beforeEach(() => {
      vi.spyOn(cypress, 'isCurrentlyRunningElectron').mockReturnValue(false)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      electronMock.open.mockReset()
    })

    afterAll(() => {
      delete requireCjs.cache[electronPath]
    })

    it('rejects with the error when Electron fails to open', async () => {
      const err = new Error('electron failed to open')

      electronMock.open.mockRejectedValue(err)

      await expect(cypress.runElectron('run', {})).rejects.toBe(err)
    })

    it('resolves with the exit code as totalFailed when the child closes', async () => {
      const child = new EventEmitter()

      electronMock.open.mockResolvedValue(child)

      const result = cypress.runElectron('run', {})

      await vi.waitFor(() => expect(child.listenerCount('close')).toBe(1))
      child.emit('close', 3, null)

      await expect(result).resolves.toEqual({ totalFailed: 3 })
    })

    it('resolves with 1 in smoke test mode when the child is killed by a signal', async () => {
      const child = new EventEmitter()

      electronMock.open.mockResolvedValue(child)

      const result = cypress.runElectron('smokeTest', {})

      await vi.waitFor(() => expect(child.listenerCount('close')).toBe(1))
      child.emit('close', null, 'SIGTERM')

      await expect(result).resolves.toBe(1)
    })
  })
})
