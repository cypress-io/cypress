/**
 * @vitest-environment jsdom
 */
import _ from 'lodash'
import Bluebird from 'bluebird'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import '../../../src/config/bluebird'
import $Command from '../../../src/cypress/command'
import { CommandQueue } from '../../../src/cypress/command_queue'
import { create as createStability } from '../../../src/cy/stability'
import type { StateFunc } from '../../../src/cypress/state'

const createState = (initialState: Record<string, any> = {}): StateFunc => {
  const values = { ...initialState }

  const state = (function (key?: string | Record<string, any>, value?: any) {
    if (typeof key === 'undefined') {
      return values
    }

    if (typeof key === 'object') {
      Object.assign(values, key)

      return values
    }

    if (arguments.length === 2) {
      values[key] = value
    }

    return values[key]
  }) as StateFunc

  return state
}

const createCommand = (fn: () => any) => {
  return $Command.create({
    name: 'customCommand',
    args: [],
    type: 'parent',
    chainerId: _.uniqueId('ch'),
    userInvocationStack: '',
    fn,
  })
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('@packages/driver/src/cypress/command_queue', () => {
  let Cypress
  let cy
  let runnable
  let state: StateFunc
  let queue: CommandQueue

  const setup = (initialState: Record<string, any> = {}) => {
    state = createState({ runnable, ...initialState })
    queue = new CommandQueue(state, createStability(Cypress, state), cy)

    // the end of the queue reads the global cy
    ;(globalThis as any).cy = { state }
  }

  beforeEach(() => {
    Cypress = {
      // Cypress.action returns emitThen's Bluebird promise, which a cancel propagates through
      action: vi.fn((event) => (event === 'cy:command:start:async' ? Bluebird.resolve() : undefined)),
      once: vi.fn(),
      removeListener: vi.fn(),
      log: vi.fn(),
    }

    ;(globalThis as any).Cypress = Cypress

    cy = {
      timeout: vi.fn(() => 4000),
      clearTimeout: vi.fn(),
      isCy: () => false,
      fail: vi.fn(),
      setSubjectForChainer: vi.fn(),
    }

    runnable = {
      state: undefined,
      resetTimeout: vi.fn(),
      isPending: () => false,
    }
  })

  afterEach(() => {
    delete (globalThis as any).Cypress
    delete (globalThis as any).cy
  })

  describe('runnable timer before each command', () => {
    it('keeps it when no page load has happened in the test yet', async () => {
      setup({ isStable: undefined })
      queue.add(createCommand(() => new Promise(() => {})))
      queue.run()
      await flush()

      expect(cy.clearTimeout).not.toHaveBeenCalled()
    })

    it('keeps it when the page is stable', async () => {
      setup({ isStable: true })
      queue.add(createCommand(() => new Promise(() => {})))
      queue.run()
      await flush()

      expect(cy.clearTimeout).not.toHaveBeenCalled()
    })

    it('clears it while a page is loading, in favor of the page load timeout', async () => {
      setup({ isStable: false })
      queue.add(createCommand(() => new Promise(() => {})))
      queue.run()
      await flush()

      expect(cy.clearTimeout).toHaveBeenCalled()
    })
  })
})
