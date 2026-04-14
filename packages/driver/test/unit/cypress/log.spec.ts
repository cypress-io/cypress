/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { LogUtils } from '../../../src/cypress/log'

describe('LogUtils.reduceMemory', () => {
  it('nulls payloads and unknown keys while preserving identifiers and core metadata', () => {
    const attrs: Record<string, unknown> = {
      id: 'log-https://example.com-1',
      testId: 'r1',
      state: 'passed',
      message: 'a'.repeat(5000),
      name: 'get',
      displayName: 'GET',
      alias: '@foo',
      referencesAlias: '@bar',
      functionName: 'stub',
      method: 'GET',
      url: `https://example.com/${'p'.repeat(2000)}`,
      response: 'body'.repeat(1000),
      snapshots: [{ foo: 'bar' }],
      consoleProps: { Yielded: 'x' },
      renderProps: { message: 'm' },
      err: { message: 'e', stack: 's'.repeat(3000) },
      wallClockStartedAt: '2020-01-01T00:00:00.000Z',
      numResponses: 2,
      myPluginAuditTrail: { events: ['x'.repeat(10_000)] },
      myPluginSummary: 'z'.repeat(5000),
    }

    LogUtils.reduceMemory(attrs)

    expect(attrs.id).toBe('log-https://example.com-1')
    expect(attrs.testId).toBe('r1')
    expect(attrs.state).toBe('passed')
    expect(attrs.numResponses).toBe(2)
    expect(attrs.wallClockStartedAt).toBe('2020-01-01T00:00:00.000Z')
    expect(attrs.name).toBe('get')
    expect(attrs.displayName).toBe('GET')
    expect(attrs.alias).toBe('@foo')
    expect(attrs.referencesAlias).toBe('@bar')
    expect(attrs.functionName).toBe('stub')
    expect(attrs.method).toBe('GET')
    expect(attrs.message).toBeNull()
    expect(attrs.url).toBeNull()
    expect(attrs.response).toBeNull()
    expect(attrs.snapshots).toBeNull()
    expect(attrs.consoleProps).toBeNull()
    expect(attrs.renderProps).toBeNull()
    expect(attrs.err).toBeNull()
    expect(attrs.myPluginAuditTrail).toBeNull()
    expect(attrs.myPluginSummary).toBeNull()
  })

  it('nulls string $el and selector values', () => {
    const attrs: Record<string, unknown> = {
      id: '1',
      $el: '#'.repeat(4000),
      selector: '.'.repeat(4000),
    }

    LogUtils.reduceMemory(attrs)

    expect(attrs.$el).toBeNull()
    expect(attrs.selector).toBeNull()
  })
})
