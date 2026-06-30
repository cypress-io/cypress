import { describe, it, expect } from 'vitest'
import { getBackendStaticResponse } from '../../../src/cy/net-stubbing/static-response-utils'

describe('getBackendStaticResponse', () => {
  it('omits merged origin body when fixture is set (res.send regression)', () => {
    const backend = getBackendStaticResponse({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      fixture: 'valid.json',
      body: '<html>Cannot GET /foo</html>',
    })

    expect(backend.fixture).toEqual({ filePath: 'valid.json', encoding: undefined })
    expect(backend.body).toBeUndefined()
    expect(backend.statusCode).toBe(200)
  })
})
