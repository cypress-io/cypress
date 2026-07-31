/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { LogUtils, Log } from '../../../src/cypress/log'

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

describe('Log#snapshot gating', () => {
  afterEach(() => {
    delete (globalThis as any).Cypress
  })

  // Builds a Log whose config/state/Cypress globals are stubbed so we can drive
  // the `snapshot()` bail condition and observe whether a snapshot is taken
  // (i.e. whether `createSnapshot` is invoked).
  const buildLog = ({
    isInteractive,
    numTestsKeptInMemory,
    isProtocolEnabled,
    isCrossOriginLog = false,
    isCrossOriginSpecBridge = false,
  }: {
    isInteractive: boolean
    numTestsKeptInMemory: number
    isProtocolEnabled: boolean
    isCrossOriginLog?: boolean
    isCrossOriginSpecBridge?: boolean
  }) => {
    const createSnapshot = vi.fn(() => ({ name: 'snapshot', timestamp: 1 }))

    const state = (key: string) => {
      if (key === 'isProtocolEnabled') return isProtocolEnabled

      return undefined
    }

    const config = (key: string) => {
      if (key === 'isInteractive') return isInteractive

      if (key === 'numTestsKeptInMemory') return numTestsKeptInMemory

      return undefined
    }

    const globalScope = globalThis as any

    globalScope.Cypress = {
      isCrossOriginSpecBridge,
      state,
      once: vi.fn(),
    }

    const log = new Log(createSnapshot, state, config, () => {})

    if (isCrossOriginLog) {
      log.set('isCrossOriginLog', true)
    }

    return { log, createSnapshot }
  }

  const expectSnapshotTaken = (opts, taken: boolean) => {
    const { log, createSnapshot } = buildLog(opts)

    log.snapshot()

    expect(createSnapshot).toHaveBeenCalledTimes(taken ? 1 : 0)
  }

  it('does not snapshot in a plain headless run (protocol off, no retention)', () => {
    expectSnapshotTaken({ isInteractive: false, numTestsKeptInMemory: 0, isProtocolEnabled: false }, false)
  })

  it('snapshots in a headless protocol run (Test Replay)', () => {
    expectSnapshotTaken({ isInteractive: false, numTestsKeptInMemory: 0, isProtocolEnabled: true }, true)
  })

  it('snapshots in Open Mode while tests are retained in memory (time-travel)', () => {
    expectSnapshotTaken({ isInteractive: true, numTestsKeptInMemory: 50, isProtocolEnabled: false }, true)
  })

  it('does not snapshot in Open Mode when no tests are retained and protocol is off', () => {
    expectSnapshotTaken({ isInteractive: true, numTestsKeptInMemory: 0, isProtocolEnabled: false }, false)
  })

  it('snapshots in Open Mode with protocol enabled even when no tests are retained (e.g. Studio AI)', () => {
    expectSnapshotTaken({ isInteractive: true, numTestsKeptInMemory: 0, isProtocolEnabled: true }, true)
  })

  it('defers a cross-origin log tracked on the primary origin (spec bridge sends its own)', () => {
    expectSnapshotTaken({
      isInteractive: true,
      numTestsKeptInMemory: 50,
      isProtocolEnabled: true,
      isCrossOriginLog: true,
      isCrossOriginSpecBridge: false,
    }, false)
  })

  it('snapshots a cross-origin log on the spec bridge itself', () => {
    expectSnapshotTaken({
      isInteractive: true,
      numTestsKeptInMemory: 50,
      isProtocolEnabled: true,
      isCrossOriginLog: true,
      isCrossOriginSpecBridge: true,
    }, true)
  })
})
