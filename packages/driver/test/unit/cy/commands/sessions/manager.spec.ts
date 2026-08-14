/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import SessionsManager from '../../../../../src/cy/commands/sessions/manager'

describe('@packages/driver/src/cy/commands/sessions/manager', () => {
  const makeManager = (automation: any) => {
    const Cypress = { automation, log: vi.fn(), backend: vi.fn() }
    const cy = { state: vi.fn() }

    return new SessionsManager(Cypress as any, cy as any)
  }

  describe('cookie automation time-boxes', () => {
    it('resolves with the automation result when the browser answers', async () => {
      const cookies = [{ name: 'foo', value: 'bar' }]
      const manager = makeManager(vi.fn().mockResolvedValue(cookies))

      await expect(manager.sessions.getCookies()).resolves.to.deep.equal(cookies)
    })

    describe('when the browser never answers', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      // an unanswered automation used to hang the between-test lifecycle
      // forever, since nothing beneath the driver bounds these round trips
      const commands = ['get:cookies', 'set:cookies', 'clear:cookies'] as const

      commands.forEach((command) => {
        it(`rejects naming the '${command}' automation command`, async () => {
          const automation = vi.fn((name: string) => {
            // clear:cookies reads the current cookies first; only stall the
            // command under test so the rejection is attributable
            return name === command ? new Promise(() => {}) : Promise.resolve([])
          })

          const manager = makeManager(automation)
          const api = {
            'get:cookies': manager.sessions.getCookies,
            'set:cookies': () => manager.sessions.setCookies([]),
            'clear:cookies': manager.sessions.clearCookies,
          }[command]

          const pending = api()
          const assertion = expect(pending).rejects.toThrow(`the '${command}' automation command`)

          await vi.advanceTimersByTimeAsync(20_000)

          await assertion
        })
      })
    })
  })
})
