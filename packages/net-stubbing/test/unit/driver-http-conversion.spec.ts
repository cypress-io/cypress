import { describe, it, expect } from 'vitest'
import { PassThrough } from 'stream'
import { materializeResponseBody } from '../../lib/core/merge-handler-result'
import { toDriverInterceptEventData } from '../../lib/driver-http-conversion'

describe('driver-http-conversion', () => {
  const usersJson = JSON.stringify([
    { id: 1, name: 'Leanne Graham' },
    { id: 2, name: 'Ervin Howell' },
    { id: 3, name: 'Clementine Bauch' },
  ])

  it('serializes materialized JSON origin body on response:callback wire events', () => {
    const url = 'https://jsonplaceholder.typicode.com/users?_limit=3'

    const wire = toDriverInterceptEventData('response:callback', {
      url,
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: usersJson,
    })

    expect(wire).toMatchObject({
      url,
      body: usersJson,
      statusCode: 200,
    })

    expect(JSON.parse(wire.body as string)).toHaveLength(3)
  })

  it('does not read stream() during wire conversion alone', () => {
    const url = 'https://jsonplaceholder.typicode.com/users?_limit=3'
    const originStream = new PassThrough()

    originStream.end(usersJson)

    const wire = toDriverInterceptEventData('response:callback', {
      url,
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      stream: async () => originStream,
    })

    expect(wire.body).toBe('')
  })

  it('omits empty statusMessage from driver wire responses', () => {
    const wire = toDriverInterceptEventData('response', {
      url: 'http://localhost/some-url',
      statusCode: 200,
      headers: {},
      body: 'stubbed response',
    })

    expect(wire).not.toHaveProperty('statusMessage')
  })

  it('serializes JSON after materializeResponseBody', async () => {
    const url = 'https://jsonplaceholder.typicode.com/users?_limit=3'
    const originStream = new PassThrough()

    originStream.end(usersJson)

    const response = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      stream: async () => originStream,
    }

    await materializeResponseBody(response)

    const wire = toDriverInterceptEventData('response:callback', {
      url,
      ...response,
    })

    expect(wire.body).toBe(usersJson)
    expect(JSON.parse(wire.body as string)).toHaveLength(3)
  })
})
