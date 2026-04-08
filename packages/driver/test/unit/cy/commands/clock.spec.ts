import { beforeEach, describe, expect, it, vi } from 'vitest'

import registerClockCommands from '../../../../src/cy/commands/clock'

describe('cy/commands/clock', () => {
  type MockLog = {
    snapshot: ReturnType<typeof vi.fn>
    end: ReturnType<typeof vi.fn>
  }

  let commands: Record<string, Function>
  let logs: MockLog[]
  let state: ReturnType<typeof vi.fn>
  let stateValues: Record<string, any>

  beforeEach(() => {
    commands = {}
    logs = []
    stateValues = { ctx: {}, window }

    state = vi.fn((key, ...args) => {
      if (args.length === 1) {
        const [value] = args

        stateValues = { ...stateValues, [key]: value }

        return value
      }

      return stateValues[key]
    })

    const Commands = {
      addAll: vi.fn((_, registeredCommands) => {
        Object.assign(commands, registeredCommands)

        return registeredCommands
      }),
    }

    const Cypress = {
      prependListener: vi.fn(),
      on: vi.fn(),
      log: vi.fn(() => {
        const log = {
          snapshot: vi.fn().mockReturnThis(),
          end: vi.fn().mockReturnThis(),
        }

        logs.push(log)

        return log
      }),
    }

    registerClockCommands(Commands, Cypress, {}, state)
  })

  it('should resolve promises queued during a tick before continuing', async () => {
    const onLoaded = vi.fn()

    const getPromise = () => {
      return new window.Promise((resolve) => {
        window.setTimeout(resolve, 100)
      })
    }

    const clock = commands.clock(undefined)

    try {
      window.setTimeout(() => {
        getPromise().then(() => {
          window.setTimeout(onLoaded, 100)
        })
      }, 100)

      await commands.tick(undefined, 2000)

      expect(onLoaded).toHaveBeenCalledOnce()
    } finally {
      clock.restore({ log: false })
    }
  })

  it('should close the tick log when ticking rejects', async () => {
    const clock = commands.clock(undefined)

    try {
      window.setTimeout(() => {
        throw new Error('boom')
      }, 0)

      await expect(commands.tick(undefined, 0)).rejects.toThrow('boom')

      expect(logs).toHaveLength(2)
      expect(logs[1].snapshot).toHaveBeenCalledTimes(2)
      expect(logs[1].snapshot).toHaveBeenNthCalledWith(1, 'before', { next: 'after' })
      expect(logs[1].end).toHaveBeenCalledOnce()
    } finally {
      clock.restore({ log: false })
    }
  })

  it('should treat null as 0 milliseconds for the yielded clock', () => {
    const onLoaded = vi.fn()
    const clock = commands.clock(undefined)

    try {
      window.setTimeout(onLoaded, 0)

      clock.tick(null)

      expect(onLoaded).toHaveBeenCalledOnce()
    } finally {
      clock.restore({ log: false })
    }
  })
})
