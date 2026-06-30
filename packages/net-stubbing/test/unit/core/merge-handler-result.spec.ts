import { describe, it, expect } from 'vitest'
import {
  mergeIncomingRequestChanges,
  mergeIncomingResponseChanges,
} from '../../../lib/core/merge-handler-result'

describe('core/merge-handler-result', () => {
  it('merges handler changes and resolves relative URLs', () => {
    const before = {
      url: 'http://example.com/base/',
      headers: { 'content-length': '4' },
      body: 'body',
      method: 'GET',
    } as any

    const after = {
      url: 'relative',
      headers: { 'content-length': '4' },
      body: 'body',
      method: 'GET',
    } as any

    const resolved = mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/base/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(resolved).toBe('http://example.com/base/relative')
    expect(before.url).toBe('http://example.com/base/relative')
  })

  // https://github.com/cypress-io/cypress/issues/25767
  it('preserves empty-string request header values set by handler', () => {
    const before = {
      url: 'http://example.com/',
      headers: { foo: 'original', bar: 'keep' },
      body: '',
      method: 'GET',
    } as any

    const after = {
      url: 'http://example.com/',
      headers: { foo: '', bar: 'keep' },
      body: '',
      method: 'GET',
    } as any

    mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(before.headers.foo).toBe('')
    expect(before.headers.bar).toBe('keep')
  })

  it('removes request headers deleted or set to undefined by handler', () => {
    const before = {
      url: 'http://example.com/',
      headers: { foo: 'original', bar: 'remove-me' },
      body: '',
      method: 'GET',
    } as any

    const after = {
      url: 'http://example.com/',
      headers: { foo: 'original' },
      body: '',
      method: 'GET',
    } as any

    mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(before.headers.foo).toBe('original')
    expect(before.headers.bar).toBeUndefined()
  })

  it('merges requestBodyMaterialized without body when handler leaves body unset', () => {
    const before = {
      url: 'http://example.com/',
      headers: {},
      body: undefined,
      requestBodyMaterialized: true,
      method: 'GET',
    } as any

    const after = {
      url: 'http://example.com/',
      headers: { 'x-test': 'changed' },
      body: undefined,
      requestBodyMaterialized: true,
      method: 'GET',
    } as any

    mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(before.body).toBeUndefined()
    expect(before.requestBodyMaterialized).toBe(true)
    expect(before.headers['x-test']).toBe('changed')
  })

  it('records deleted response headers for downstream codec handling', () => {
    const before = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
    } as any

    const after = {
      statusCode: 200,
      headers: {},
      body: '{"ok":true}',
    } as any

    mergeIncomingResponseChanges(before, after, {
      serializableProps: ['headers', 'body', 'statusCode'],
    })

    expect(before.headers['content-type']).toBeUndefined()
    expect(before.deletedHeaders).toEqual(['content-type'])
  })
})
