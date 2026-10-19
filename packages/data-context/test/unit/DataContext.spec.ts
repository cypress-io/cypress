import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { DataContext } from '../../src'
import { getError } from '@packages/errors'
import { createTestDataContext } from './helper'

const requireError = (message: string) => {
  return getError('CONFIG_FILE_REQUIRE_ERROR', '/project/cypress.config.js', new Error(message))
}

describe('DataContext open mode error output', () => {
  let ctx: DataContext
  let consoleError: ReturnType<typeof jest.spyOn>

  const printed = () => consoleError.mock.calls.map((args) => args.join(' ')).join('\n')

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    ctx = createTestDataContext('open')
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  describe('#onError', () => {
    it('prints a config load error, including its stack trace, for a caller reading the process output', () => {
      ctx.onError(requireError('SyntaxError: Unexpected end of input'))

      expect(printed()).toContain('SyntaxError: Unexpected end of input')
      expect(printed()).toContain('/project/cypress.config.js')
    })

    it('prints the error for a support file that does not exist', () => {
      ctx.onError(getError('SUPPORT_FILE_NOT_FOUND', '/project/cypress/support/e2e.js'))

      expect(printed()).toContain('/project/cypress/support/e2e.js')
    })

    it('prints an error that did not come from a template with its stack, so it can be traced', () => {
      const error = new Error('inotify watch limit reached') as any

      ctx.onError(error)

      expect(printed()).toContain('inotify watch limit reached')
      expect(printed()).toContain('DataContext.spec')
    })

    it('prints a thrown value that is not an error without failing', () => {
      expect(() => ctx.onError({ isCypressErr: true } as any)).not.toThrow()
      expect(printed()).toContain('[object Object]')
    })

    it('prints an import error from the config file', () => {
      ctx.onError(requireError(`Cannot find module 'missing-module'`))

      expect(printed()).toContain(`Cannot find module 'missing-module'`)
    })

    it('prints the details of an error that has them', () => {
      const error = getError('CONFIG_FILE_REQUIRE_ERROR', '/project/cypress.config.js', new Error('boom'))

      error.details = 'extra detail text'
      ctx.onError(error)

      expect(printed()).toContain('extra detail text')
    })

    it('still records the error for the Launchpad', () => {
      ctx.onError(requireError('boom'))

      expect(ctx.coreData.diagnostics.error?.cypressError.details).toContain('boom')
    })

    it('prints a repeat of the error already on display only once', () => {
      const error = requireError('boom')

      ctx.onError(error)
      ctx.onError(error)

      expect(consoleError).toHaveBeenCalledTimes(1)
    })

    it('prints a different error', () => {
      ctx.onError(requireError('first'))
      ctx.onError(requireError('second'))

      expect(consoleError).toHaveBeenCalledTimes(2)
    })

    it('prints the error again when it comes back after the error was cleared', () => {
      const error = requireError('boom')

      ctx.onError(error)

      ctx.update((d) => {
        d.diagnostics.error = null
      })

      ctx.onError(error)

      expect(consoleError).toHaveBeenCalledTimes(2)
    })
  })

  describe('#onWarning', () => {
    it('prints a warning', () => {
      ctx.onWarning(getError('CONFIG_FILE_REQUIRE_ERROR', '/project/cypress.config.js', new Error('careful')))

      expect(printed()).toContain('careful')
    })

    it('prints a repeat of a warning already on display only once', () => {
      const warning = requireError('careful')

      ctx.onWarning(warning)
      ctx.onWarning(warning)

      expect(consoleError).toHaveBeenCalledTimes(1)
    })
  })

  describe('in run mode', () => {
    it('leaves error output to the run mode exit path', () => {
      const runCtx = createTestDataContext('run')
      const runModeExitEarly = jest.fn()

      // @ts-expect-error - only the exit hook is needed
      runCtx.lifecycleManager.runModeExitEarly = runModeExitEarly

      runCtx.onError(requireError('boom'))

      expect(runModeExitEarly).toHaveBeenCalledTimes(1)
      expect(consoleError).not.toHaveBeenCalled()
    })
  })
})
