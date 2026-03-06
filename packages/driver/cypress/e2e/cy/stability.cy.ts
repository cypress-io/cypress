import type { ICypress } from '../../../src/cypress'
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
    } as ICypress
    const stability = create(CypressMock, state)

    const first = stability.whenStable(() => {
      order.push('first')
    })
    const second = stability.whenStable(() => {
      order.push('second')
    })

    stability.isStable(true, 'test release waiters')

    return Promise.all([first, second]).then(() => {
      expect(order).to.deep.equal(['before-release', 'first', 'second'])
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
    } as ICypress
    const stability = create(CypressMock, state)
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
      expect(secondWaiterResolved).to.equal(false)

      stability.isStable(true, 'second release')

      return secondWaiter
    })
    .then(() => {
      expect(order).to.deep.equal(['first', 'second'])
    })
  })
})
