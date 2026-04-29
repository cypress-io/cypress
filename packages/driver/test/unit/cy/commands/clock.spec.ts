import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InstalledClock } from '@sinonjs/fake-timers'

import * as clockModule from '../../../../src/cypress/clock'
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
  let Cypress: {
    prependListener: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    log: ReturnType<typeof vi.fn>
  }
  let Commands: {
    addAll: ReturnType<typeof vi.fn>
  }

  const registerCommands = () => {
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

    Commands = {
      addAll: vi.fn((_, registeredCommands) => {
        Object.assign(commands, registeredCommands)

        return registeredCommands
      }),
    }

    Cypress = {
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
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    registerCommands()
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

  it('should reject NaN milliseconds', () => {
    const clock = commands.clock(undefined)

    try {
      expect(() => commands.tick(undefined, Number.NaN)).toThrow(
        '`clock.tick()`/`cy.tick()` only accepts a number as their argument. You passed: `NaN`',
      )
    } finally {
      clock.restore({ log: false })
    }
  })

  it('should fall back to a synchronous tick when async ticking is unavailable', async () => {
    const tick = vi.fn().mockReturnValue(250)

    vi.spyOn(clockModule, 'create').mockReturnValue({
      tick,
      tickAsync: undefined,
      restore: vi.fn(),
      setSystemTime: vi.fn(),
      bind: vi.fn(),
      details: vi.fn((): Pick<InstalledClock, 'now' | 'methods'> => {
        return { now: 0, methods: ['setTimeout'] }
      }),
    })

    registerCommands()
    commands.clock(undefined)

    await expect(commands.tick(undefined, 250)).resolves.toMatchObject({
      tick: expect.any(Function),
    })

    expect(tick).toHaveBeenCalledOnce()
    expect(tick).toHaveBeenCalledWith(250)
    expect(logs).toHaveLength(2)
    expect(logs[1].snapshot).toHaveBeenCalledTimes(2)
    expect(logs[1].end).toHaveBeenCalledOnce()
  })

  it('should close the tick log when the synchronous fallback throws', async () => {
    const tick = vi.fn().mockImplementation(() => {
      throw new Error('boom')
    })

    vi.spyOn(clockModule, 'create').mockReturnValue({
      tick,
      tickAsync: undefined,
      restore: vi.fn(),
      setSystemTime: vi.fn(),
      bind: vi.fn(),
      details: vi.fn((): Pick<InstalledClock, 'now' | 'methods'> => {
        return { now: 0, methods: ['setTimeout'] }
      }),
    })

    registerCommands()
    commands.clock(undefined)

    await expect(commands.tick(undefined, 250)).rejects.toThrow('boom')

    expect(logs).toHaveLength(2)
    expect(logs[1].snapshot).toHaveBeenCalledTimes(2)
    expect(logs[1].snapshot).toHaveBeenNthCalledWith(1, 'before', {
      next: 'after',
    })

    expect(logs[1].end).toHaveBeenCalledOnce()
  })
})
