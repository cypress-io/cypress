import { describe, it, expect } from 'vitest'
import type { StateFunc } from '../../../src/cypress/state'
import { create } from '../../../src/cy/stability'

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

describe('src/cy/stability', () => {
  it('releases all waiters registered while unstable', () => {
    const order: string[] = []
    const state = createState({ isStable: false })
    const CypressMock = {
      action: (name: string) => {
        if (name === 'cy:before:stability:release') {
          order.push('before-release')

          return Promise.resolve()
        }

        return undefined
      },
    }
    const stability = create(CypressMock as any, state)

    const first = stability.whenStable(() => {
      order.push('first')
    })
    const second = stability.whenStable(() => {
      order.push('second')
    })

    stability.isStable(true, 'test release waiters')

    return Promise.all([first, second]).then(() => {
      expect(order).toEqual(['before-release', 'first', 'second'])
    })
  })

  it('keeps new unstable waiters for the next stability cycle', () => {
    const state = createState({ isStable: false })
    const CypressMock = {
      action: (name: string) => {
        if (name === 'cy:before:stability:release') {
          return Promise.resolve()
        }

        return undefined
      },
    }
    const stability = create(CypressMock as any, state)
    const order: string[] = []
    let secondWaiterResolved = false
    let secondWaiter: Promise<unknown> | undefined

    const firstWaiter = stability.whenStable(() => {
      order.push('first')
      stability.isStable(false, 'flip unstable during release')
      secondWaiter = stability.whenStable(() => {
        order.push('second')
        secondWaiterResolved = true
      })
    })

    stability.isStable(true, 'first release')

    return firstWaiter
    .then(() => {
      expect(secondWaiterResolved).toBe(false)

      stability.isStable(true, 'second release')

      return secondWaiter
    })
    .then(() => {
      expect(order).toEqual(['first', 'second'])
    })
  })

  it('does not release waiters until isStable(true) is signaled', () => {
    const state = createState({ isStable: false })
    const CypressMock = {
      action: (name: string) => {
        if (name === 'cy:before:stability:release') {
          return Promise.resolve()
        }

        return undefined
      },
    }
    const stability = create(CypressMock as any, state)
    let resolved = false

    const pending = stability.whenStable(() => {
      resolved = true
    })

    return Promise.race([
      pending.then(() => {
        throw new Error('waiter should not resolve without isStable(true)')
      }),
      new Promise((resolve) => setTimeout(resolve, 20)),
    ]).then(() => {
      expect(resolved).toBe(false)
    })
  })

  it('releases all waiters after prolonged instability once isStable(true) fires', () => {
    const order: string[] = []
    const state = createState({ isStable: false })
    const CypressMock = {
      action: (name: string) => {
        if (name === 'cy:before:stability:release') {
          return Promise.resolve()
        }

        return undefined
      },
    }
    const stability = create(CypressMock as any, state)

    const waiters = [
      stability.whenStable(() => order.push('first')),
      stability.whenStable(() => order.push('second')),
      stability.whenStable(() => order.push('third')),
    ]

    return new Promise((resolve) => setTimeout(resolve, 20))
    .then(() => {
      stability.isStable(true, 'delayed load')

      return Promise.all(waiters)
    })
    .then(() => {
      expect(order).toEqual(['first', 'second', 'third'])
    })
  })

  it('documents pre-33446 overwrite behavior where only the last waiter is kept', () => {
    const state = createState({ isStable: false })
    let whenStableCallback: (() => Promise<void>) | null = null

    const pre33446Stability = {
      isStable: (stable: boolean = true) => {
        if (state('isStable') === stable) {
          return
        }

        state('isStable', stable)

        if (!stable || !whenStableCallback) {
          return
        }

        const callback = whenStableCallback

        whenStableCallback = null

        return callback()
      },
      whenStable: (fn: () => any) => {
        if (state('isStable') !== false) {
          return Promise.resolve(fn())
        }

        return new Promise((resolve, reject) => {
          whenStableCallback = () => {
            return Promise.resolve(fn()).then(resolve).catch(reject)
          }
        })
      },
    }

    const order: string[] = []
    let firstResolved = false
    const first = pre33446Stability.whenStable(() => {
      order.push('first')
      firstResolved = true
    })
    const second = pre33446Stability.whenStable(() => {
      order.push('second')
    })

    pre33446Stability.isStable(true)

    return second.then(() => {
      expect(order).toEqual(['second'])

      return Promise.race([
        first.then(() => {
          throw new Error('overwritten waiter should never resolve')
        }),
        new Promise((resolve) => setTimeout(resolve, 20)),
      ]).then(() => {
        expect(firstResolved).toBe(false)
      })
    })
  })

  it('reset() clears queue and rejects pending waiters to avoid test pollution', () => {
    const order: string[] = []
    const state = createState({ isStable: false })
    const CypressMock = {
      action: () => Promise.resolve(),
    }
    const stability = create(CypressMock as any, state)

    const waiterPromise = stability.whenStable(() => {
      order.push('ran')
    })

    stability.reset()

    return waiterPromise
    .then(
      () => {
        throw new Error('waiter should have been rejected')
      },
      (err: Error) => {
        expect(err.message).toBe('Stability waiters cleared due to test reset')
      },
    )
    .then(() => {
      expect(order).toEqual([])
      state('isStable', undefined)
      stability.isStable(true, 'next test')
      expect(order).toEqual([])
    })
  })
})
