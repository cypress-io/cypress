import { beforeEach, describe, expect, it, vi } from 'vitest'

import registerClockCommands from '../../../../src/cy/commands/clock'

describe('cy/commands/clock', () => {
  let commands: Record<string, Function>
  let state: ReturnType<typeof vi.fn>
  let stateValues: Record<string, any>

  beforeEach(() => {
    commands = {}
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
        return {
          snapshot: vi.fn().mockReturnThis(),
          end: vi.fn().mockReturnThis(),
        }
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
})
