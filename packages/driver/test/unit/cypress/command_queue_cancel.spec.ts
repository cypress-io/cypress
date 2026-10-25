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

  it('does not overwrite idle revocation during the queue-end notification', async () => {
    setup({ isStable: true })
    Cypress.action.mockImplementation((event) => {
      if (event === 'cy:command:queue:end') {
        state('queueIdle', false)
      }
    })

    await queue.run()
    expect(state('queueIdle')).to.be.false
  })

  it('revokes idle eligibility when a completed chain is ended explicitly', async () => {
    setup({ isStable: true })
    await queue.run()
    expect(state('queueIdle')).to.be.true
    queue.endEarly({ canceled: false })
    expect(state('queueIdle')).to.be.false
  })

  describe('#endEarly', () => {
    let settleLate: () => void

    const runPendingChain = async () => {
      setup({ isStable: true })
      queue.add(createCommand(() => new Promise<void>((resolve) => settleLate = resolve)))
      queue.add(createCommand(() => null))
      queue.run()
      await flush()
    }

    describe('when a runnable fails', () => {
      it('stops a pending command chain from resuming when its command settles late', async () => {
        await runPendingChain()

        queue.endEarly({ canceled: false })

        expect(state('promise').isCancelled()).to.be.true
        expect(queue.index).to.equal(queue.length)
        expect(state('canceled')).to.be.undefined
        expect(runnable.resetTimeout).not.toHaveBeenCalled()
        expect(Cypress.action).not.toHaveBeenCalledWith('cy:canceled')

        settleLate()
        await flush()

        expect(Cypress.action).not.toHaveBeenCalledWith('cy:command:end', expect.anything())
      })

      it('does nothing once the command chain has settled', async () => {
        setup({ isStable: true })
        queue.add(createCommand(() => null))
        await queue.run()

        expect(cy.fail).not.toHaveBeenCalled()

        runnable.resetTimeout.mockClear()
        state('isStable', false)

        queue.endEarly({ canceled: false })

        expect(state('promise').isCancelled()).to.be.false
        expect(state('isStable')).to.be.false
        expect(runnable.resetTimeout).not.toHaveBeenCalled()
      })
    })

    describe('when the run is canceled', () => {
      it('cancels the pending command chain and emits cy:canceled', async () => {
        await runPendingChain()

        queue.endEarly({ canceled: true })

        expect(state('promise').isCancelled()).to.be.true
        expect(queue.index).to.equal(queue.length)
        expect(state('canceled')).to.be.true
        expect(runnable.resetTimeout).toHaveBeenCalled()
        expect(Cypress.action).toHaveBeenCalledWith('cy:canceled')
      })
    })
  })
})
