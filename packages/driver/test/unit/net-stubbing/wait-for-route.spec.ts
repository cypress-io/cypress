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

  describe('browser-canceled interceptions', () => {
    const browserCanceledError = () => Object.assign(new Error('The browser closed the connection before the response completed.'), { code: 'ERR_BROWSER_CONNECTION_CLOSED' })

    const stateWith = (...interceptions: Interception[]) => {
      return createState({
        routes: {
          'route-1': {
            alias: 'listItems',
            requests: Object.fromEntries(interceptions.map((i) => [i.id, i])),
          },
        },
      })
    }

    it('waits for a later interception after an aborted one', () => {
      const canceled = createInterception({ id: 'interception-1', state: 'Errored', error: browserCanceledError() })
      const resent = createInterception({ id: 'interception-2', state: 'Received' })
      const state = stateWith(canceled, resent)

      expect(waitForRoute('listItems', state, 'response')).toBeNull()

      resent.state = 'Complete'

      expect(waitForRoute('listItems', state, 'response')).toBe(resent)
      expect(canceled.responseWaited).toBe(true)
      expect(waitForRoute('listItems', state, 'response')).toBeNull()
    })

    it('returns the canceled interception when nothing follows it', () => {
      const canceled = createInterception({ state: 'Errored', error: browserCanceledError() })

      expect(waitForRoute('listItems', stateWith(canceled), 'response')).toBe(canceled)
    })

    it('returns each canceled interception to its own wait when only cancels follow', () => {
      const first = createInterception({ id: 'interception-1', state: 'Errored', error: browserCanceledError() })
      const second = createInterception({ id: 'interception-2', state: 'Errored', error: browserCanceledError() })
      const state = stateWith(first, second)

      expect(waitForRoute('listItems', state, 'response')).toBe(first)
      expect(waitForRoute('listItems', state, 'response')).toBe(second)
    })

    it('passes over repeated cancels when a later request is re-sent', () => {
      const first = createInterception({ id: 'interception-1', state: 'Errored', error: browserCanceledError() })
      const second = createInterception({ id: 'interception-2', state: 'Errored', error: browserCanceledError() })
      const resent = createInterception({ id: 'interception-3', state: 'Complete' })
      const state = stateWith(first, second, resent)

      expect(waitForRoute('listItems', state, 'response')).toBe(resent)
      expect(waitForRoute('listItems', state, 'response')).toBeNull()
    })

    it('returns other network errors without waiting for a later interception', () => {
      const failed = createInterception({ id: 'interception-1', state: 'Errored', error: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3501'), { code: 'ECONNREFUSED' }) })
      const later = createInterception({ id: 'interception-2', state: 'Received' })

      expect(waitForRoute('listItems', stateWith(failed, later), 'response')).toBe(failed)
    })
  })
})
