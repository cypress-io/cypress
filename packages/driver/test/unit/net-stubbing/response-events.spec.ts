import { describe, it, expect } from 'vitest'
import { onResponse } from '../../../src/cy/net-stubbing/events/response'
import { onAfterResponse } from '../../../src/cy/net-stubbing/events/after-response'
import type { Interception } from '../../../src/cy/net-stubbing/types'

const usersJson = JSON.stringify([
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'Sincere@april.biz' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'Shanna@melissa.tv' },
  { id: 3, name: 'Clementine Bauch', username: 'Samantha', email: 'Nathan@yesenia.net' },
])

describe('net-stubbing response events (alias spy inspect regression)', () => {
  const createInterception = (): Interception => {
    return {
      id: 'intercept-1',
      routeId: 'route-1',
      setLogFlag: () => {},
      request: {
        url: 'https://jsonplaceholder.typicode.com/users?_limit=3',
        method: 'GET',
        headers: {},
        body: '',
        query: {},
        httpVersion: '1.1',
        resourceType: 'xhr',
      },
      requestWaited: false,
      responseWaited: false,
      state: 'Received',
      subscriptions: [],
    }
  }

  it('keeps parsed origin array on interception after response:callback + after:response', async () => {
    const interception = createInterception()

    await onResponse(
      {} as Cypress.Cypress,
      {
        requestId: interception.id,
        subscription: { routeId: interception.routeId, await: false, eventName: 'response:callback' },
        eventId: 'event-1',
        data: {
          url: interception.request.url,
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: usersJson,
        },
      },
      undefined,
      {
        getRoute: () => undefined,
        getRequest: () => interception,
        sendStaticResponse: () => {},
      },
    )

    expect(interception.response?.body).toHaveLength(3)

    await onAfterResponse(
      {} as Cypress.Cypress,
      {
        requestId: interception.id,
        subscription: { routeId: interception.routeId, await: false, eventName: 'after:response' },
        eventId: 'event-2',
        data: {},
      },
      undefined,
      {
        getRoute: () => undefined,
        getRequest: () => interception,
      },
    )

    expect(interception.state).toBe('Complete')
    expect(interception.response?.body).toHaveLength(3)
  })
})
