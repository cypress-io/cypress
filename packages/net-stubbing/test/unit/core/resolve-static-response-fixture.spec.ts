import { describe, it, expect, vi } from 'vitest'
import {
  inferFixtureContentType,
  resolveStaticResponseFixture,
  sniffFixtureContentType,
} from '../../../lib/core/resolve-static-response-fixture'
import { buildHttpResponseFromStatic } from '../../../lib/core/static-response'

describe('sniffFixtureContentType', () => {
  it('returns application/json for JSON strings', () => {
    expect(sniffFixtureContentType(JSON.stringify({ foo: 'bar' }))).toEqual('application/json')
  })

  it('returns text/html for HTML-like strings', () => {
    expect(sniffFixtureContentType('<html><body>foo</body></html>')).toEqual('text/html')
  })

  it('returns text/plain for other strings', () => {
    expect(sniffFixtureContentType('foobar<p>baz')).toEqual('text/plain')
  })

  it('returns text/plain when data is undefined', () => {
    expect(sniffFixtureContentType(undefined)).toEqual('text/plain')
  })
})

describe('inferFixtureContentType', () => {
  it('prefers the fixture file extension', () => {
    expect(inferFixtureContentType('fixtures/foo.html', 'not html')).toEqual('text/html')
    expect(inferFixtureContentType('media/cypress.png', Buffer.from('png'))).toEqual('image/png')
    expect(inferFixtureContentType('valid.json', 'not json')).toEqual('application/json')
  })

  it('falls back to content sniffing when extension is unknown', () => {
    expect(inferFixtureContentType('fixture', '<html><body>x</body></html>')).toEqual('text/html')
  })
})

describe('resolveStaticResponseFixture', () => {
  it('loads fixture body and infers content-type', async () => {
    const staticResponse = {
      fixture: { filePath: 'content-in-body.html', encoding: 'utf8' as const },
    }
    const getFixture = vi.fn(async () => '<html><body>stubbed</body></html>')

    await resolveStaticResponseFixture(staticResponse, getFixture)

    expect(getFixture).toHaveBeenCalledWith('content-in-body.html', { encoding: 'utf8' })
    expect(staticResponse.headers?.['content-type']).toBe('text/html')
    expect(staticResponse.body).toBe('<html><body>stubbed</body></html>')
  })

  it('does not override an existing content-type header', async () => {
    const staticResponse = {
      fixture: { filePath: 'foo.html', encoding: 'utf8' as const },
      headers: { 'Content-Type': 'text/plain' },
    }
    const getFixture = vi.fn(async () => '<html><body>x</body></html>')

    await resolveStaticResponseFixture(staticResponse, getFixture)

    expect(staticResponse.headers?.['Content-Type']).toBe('text/plain')
  })
})

describe('buildHttpResponseFromStatic', () => {
  it('resolves driver-reply fixtures with inferred mime types', async () => {
    const getFixture = vi.fn(async () => '<html><body>reply</body></html>')

    const response = await buildHttpResponseFromStatic({
      fixture: { filePath: 'content-in-body.html', encoding: 'utf8' },
    }, getFixture)

    expect(response.headers['content-type']).toBe('text/html')
    expect(response.body).toBe('<html><body>reply</body></html>')
  })

  it('reloads fixture when body was pre-resolved at route registration', async () => {
    const getFixture = vi.fn(async () => '<html><body>from-fixture</body></html>')

    const response = await buildHttpResponseFromStatic({
      fixture: { filePath: 'foo.html', encoding: 'utf8' },
      body: '<html><body>preloaded</body></html>',
      headers: { 'content-type': 'text/html' },
    }, getFixture)

    expect(getFixture).toHaveBeenCalledOnce()
    expect(response.body).toBe('<html><body>from-fixture</body></html>')
  })
})
