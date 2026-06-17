import { describe, it, expect } from 'vitest'
import type { StateFunc } from '../../../src/cypress/state'
import type { Interception } from '../../../src/cy/net-stubbing/types'
import { waitForRoute } from '../../../src/cy/net-stubbing/wait-for-route'

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

const createInterception = (overrides: Partial<Interception> = {}): Interception => {
  return {
    id: 'interception-1',
    routeId: 'route-1',
    setLogFlag: () => {},
    request: {} as Interception['request'],
    requestWaited: false,
    responseWaited: false,
    state: 'Intercepted',
    subscriptions: [],
    ...overrides,
  }
}

describe('waitForRoute', () => {
  it('returns a pending interception for request waits before the response completes', () => {
    const interception = createInterception()
    const state = createState({
      routes: {
        'route-1': {
          alias: 'createUser',
          requests: {
            [interception.id]: interception,
          },
        },
      },
    })

    const requestWait = waitForRoute('createUser', state, 'request')
    const responseWait = waitForRoute('createUser', state, 'response')

    expect(requestWait).toBe(interception)
    expect(responseWait).toBeNull()
    expect(interception.requestWaited).toBe(true)
    expect(interception.responseWaited).toBe(false)
  })

  it('returns errored interceptions for response waits', () => {
    const interception = createInterception({ state: 'Errored' })
    const state = createState({
      routes: {
        'route-1': {
          alias: 'createUser',
          requests: {
            [interception.id]: interception,
          },
        },
      },
    })

    const responseWait = waitForRoute('createUser', state, 'response')

    expect(responseWait).toBe(interception)
    expect(interception.responseWaited).toBe(true)
  })
})
