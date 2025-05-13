/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, Mock, MockedObject } from 'vitest'
import type { KeyPressSupportedKeys } from '@packages/types'
import addCommand, { PressCommand } from '../../../../../src/cy/commands/actions/press'
import type { $Cy } from '../../../../../src/cypress/cy'
import type { StateFunc } from '../../../../../src/cypress/state'
import $errUtils from '../../../../../src/cypress/error_utils'
import Keyboard from '../../../../../src/cy/keyboard'

vi.mock('../../../../../src/cypress/error_utils', async () => {
  const original = await vi.importActual('../../../../../src/cypress/error_utils')

  return {
    default: {
      // @ts-expect-error
      ...original.default,
      // @ts-expect-error
      throwErr: vi.fn().mockImplementation(original.default.throwErr),
      // @ts-expect-error
      throwErrByPath: vi.fn().mockImplementation(original.default.throwErrByPath),
    },
  }
})

describe('cy/commands/actions/press', () => {
  let log: Mock<typeof Cypress['log']>
  let automation: Mock<typeof Cypress['automation']>
  let press: PressCommand
  let Cypress: MockedObject<Cypress.Cypress>
  let Commands: MockedObject<Cypress.Commands>
  let cy: MockedObject<$Cy>
  let state: MockedObject<StateFunc>
  let config: any
  let logReturnValue: Cypress.Log

  beforeEach(() => {
    log = vi.fn<typeof Cypress['log']>()
    automation = vi.fn<typeof Cypress['automation']>()

    Cypress = {
      // The overloads for `log` don't get applied correctly here
      // @ts-expect-error
      log,
      automation,
      // @ts-expect-error
      browser: {
        family: 'chromium',
        name: 'Chrome',
      },
    }

    Commands = {
      // @ts-expect-error - this is a generic mock impl
      addAll: vi.fn(),
    }

    // @ts-expect-error
    cy = {}

    state = {
      ...vi.fn<StateFunc>(),
      // @ts-expect-error - this is a recursive definition, so we're only defining the mock one level deep
      state: vi.fn<StateFunc>(),
      reset: vi.fn<() => Record<string, any>>(),
    }

    config = {}

    logReturnValue = {
      id: 'log_id',
      end: vi.fn(),
      error: vi.fn(),
      finish: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      snapshot: vi.fn(),
      _hasInitiallyLogged: false,
      groupEnd: vi.fn(),
    }

    Cypress.log.mockReturnValue(logReturnValue)

    addCommand(Commands, Cypress, cy, state, config)

    expect(Commands.addAll).toHaveBeenCalledOnce()

    // @ts-expect-error
    const [[obj]]: [[{press: PressCommand}]] = Commands.addAll.mock.calls

    expect(typeof obj.press).toBe('function')

    press = obj.press as PressCommand
  })

  describe('with a valid key', () => {
    const key: KeyPressSupportedKeys = Keyboard.Keys.TAB

    it('dispatches a key:press automation command', async () => {
      await press(key)
      expect(automation).toHaveBeenCalledWith('key:press', { key })
    })

    describe('with options', () => {
      let options: Cypress.Loggable & Cypress.Timeoutable

      beforeEach(() => {
        options = {
          log: false,
          timeout: 2000,
        }
      })

      it('sets timeout and hidden on the log', async () => {
        await press(key, options)
        expect(Cypress.log).toBeCalledWith({
          timeout: options.timeout,
          hidden: true,
          message: [key, { timeout: 2000 }],
          consoleProps: expect.any(Function),
        })
      })
    })
  })

  describe('with an invalid key', () => {
    it('throws an invalid key error', async () => {
      // @ts-expect-error
      const key: KeyPressSupportedKeys = 'Foo'

      await expect(press(key)).rejects.toThrow(`\`${key}\` is not supported by \`cy.press()\``)
      expect($errUtils.throwErrByPath).toHaveBeenCalledWith('press.invalid_key', {
        onFail: logReturnValue,
        args: {
          key,
        },
      })
    })
  })

  describe('when in webkit', () => {
    it('throws an unsupported browser error', async () => {
      Cypress.browser.family = 'webkit'
      await expect(press('Tab')).rejects.toThrow('`cy.press()` is not supported in webkit browsers.')
      expect($errUtils.throwErrByPath).toHaveBeenCalledWith('press.unsupported_browser', {
        onFail: logReturnValue,
        args: {
          family: Cypress.browser.family,
        },
      })
    })
  })

  describe('when in firefox below 135', () => {
    it('throws an unsupported browser version error', async () => {
      Cypress.browser.name = 'firefox'
      Cypress.browser.majorVersion = '134'
      await expect(press('Tab')).rejects.toThrow('`cy.press()` is not supported in firefox version 134. Upgrade to version 135 to use `cy.press()`.')

      expect($errUtils.throwErrByPath).toHaveBeenCalledWith('press.unsupported_browser_version', {
        onFail: logReturnValue,
        args: {
          browser: Cypress.browser.name,
          version: Cypress.browser.majorVersion,
          minimumVersion: 135,
        },
      })
    })
  })

  describe('when automation throws', () => {
    it('throws via $errUtils, passing in the results from Cypress.log', async () => {
      const thrown = new Error('Some error')

      // @ts-expect-error async is not bluebird, but that's fine
      Cypress.automation.mockImplementation(async () => {
        throw thrown
      })

      await expect(press('Tab')).rejects.toThrow(thrown)
      expect($errUtils.throwErr).toHaveBeenCalledWith(thrown, {
        onFail: logReturnValue,
      })
    })
  })
})
