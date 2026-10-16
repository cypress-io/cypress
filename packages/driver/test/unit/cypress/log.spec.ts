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

describe('LogUtils.toSerializedConsoleProps', () => {
  it('projects DOM, tables, functions, cycles, and throwing values into JSON-safe data', () => {
    const button = document.createElement('button')
    const cycle: Record<string, unknown> = { label: 'cycle' }
    const throwing = {}
    const unreadable = new Proxy({}, {
      ownKeys () {
        throw new Error('nope')
      },
    })
    const protoValue = JSON.parse('{"__proto__":{"polluted":true}}')
    const throwingArray = [1, 2]

    Object.defineProperty(throwingArray, 1, {
      get () {
        throw new Error('nope')
      },
    })

    throwingArray[Symbol.iterator] = () => {
      throw new Error('nope')
    }

    button.id = 'submit'
    button.className = 'primary'
    cycle.self = cycle
    Object.defineProperty(throwing, 'value', {
      enumerable: true,
      get () {
        throw new Error('nope')
      },
    })

    const result = LogUtils.toSerializedConsoleProps({
      name: 'click',
      type: 'command',
      props: {
        Yielded: button,
        Handler: function handler () {},
        cycle,
        throwing,
        unreadable,
        sparse: new Array(2),
        throwingArray,
        protoValue,
        count: 1n,
      },
      table: {
        1: () => {
          return {
            name: 'Mouse Events',
            data: [{ Target: button }],
            columns: ['Target'],
          }
        },
        2: () => {
          throw new Error('nope')
        },
      },
    })

    expect(result).toEqual({
      name: 'click',
      type: 'command',
      props: {
        Yielded: '<button#submit.primary>',
        Handler: result.props.Handler,
        cycle: { label: 'cycle', self: null },
        throwing: { value: null },
        unreadable: null,
        sparse: [null, null],
        throwingArray: [1, null],
        protoValue,
        count: '1',
      },
      table: {
        1: {
          name: 'Mouse Events',
          data: [{ Target: '<button#submit.primary>' }],
          columns: ['Target'],
        },
        2: null,
      },
    })

    expect(result.props.Handler).toContain('function handler')
    expect(Object.prototype.hasOwnProperty.call(result.props.protoValue, '__proto__')).toBe(true)
    expect(result.props.protoValue.__proto__).toEqual({ polluted: true })
    expect((Object.prototype as any).polluted).toBeUndefined()
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('keeps the contents of values whose state is not enumerable', () => {
    const throwingToJSON = {
      toJSON () {
        throw new Error('nope')
      },
    }

    const uniterable = new Set([1])

    uniterable.values = () => {
      throw new Error('nope')
    }

    const result = LogUtils.toSerializedConsoleProps({
      name: 'request',
      props: {
        date: new Date('2026-07-27T12:00:00.000Z'),
        map: new Map<any, any>([['token', 'abc'], [1, { nested: true }]]),
        set: new Set(['a', 'b']),
        serializable: { toJSON: () => ({ shape: 'custom' }) },
        throwingToJSON,
        uniterable,
      },
    })

    expect(result).toEqual({
      name: 'request',
      props: {
        date: '2026-07-27T12:00:00.000Z',
        map: [['token', 'abc'], [1, { nested: true }]],
        set: ['a', 'b'],
        serializable: { shape: 'custom' },
        throwingToJSON: null,
        uniterable: null,
      },
    })

    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('does not recurse when a value serializes to itself', () => {
    const selfJSON: Record<string, unknown> = { label: 'self' }

    selfJSON.toJSON = () => selfJSON

    const cyclicMap = new Map<string, unknown>()

    cyclicMap.set('self', cyclicMap)

    const result = LogUtils.toSerializedConsoleProps({ props: { selfJSON, cyclicMap } })

    expect(result).toEqual({
      props: {
        selfJSON: null,
        cyclicMap: [['self', null]],
      },
    })
  })

  // The payload asserting on a `cy.request` response produces: the response body
  // twice over — once yielded, once per request/response pair under the keys
  // `@packages/server`'s `request.ts` writes — each dwarfing the rest of it.
  const responseConsoleProps = () => {
    const body = Array.from({ length: 500 }, (_value, index) => ({ id: index, tags: ['a', 'b'] }))

    return {
      name: 'assert',
      type: 'command',
      props: {
        actual: {
          body,
          headers: { 'content-type': 'application/json' },
          status: 200,
          allRequestResponses: [{
            'Request Body': null,
            'Request Headers': { host: 'localhost' },
            'Request URL': 'http://localhost:3000/comments',
            'Response Body': JSON.stringify(body),
            'Response Headers': { 'content-type': 'application/json' },
            'Response Status': 200,
          }],
        },
        expected: 'duration',
      },
      Message: 'expected { Object (body, headers, ...) } to have property duration',
    }
  }

  const withheld = (length: number): string => {
    return `[${length.toLocaleString('en-US')} characters withheld — pass --json to include it]`
  }

  // 23,891 characters serialized: individually trivial entries that together
  // clear the container bound.
  const manyEntries = () => Array.from({ length: 5000 }, (_value, index) => index)

  it('names a long value by its length, leaving the structure around it readable', () => {
    const consoleProps = responseConsoleProps()
    const pair = consoleProps.props.actual.allRequestResponses[0]
    const result = LogUtils.toSerializedConsoleProps(consoleProps)

    expect(result).toEqual({
      name: 'assert',
      type: 'command',
      props: {
        actual: {
          body: withheld(JSON.stringify(consoleProps.props.actual.body).length),
          headers: { 'content-type': 'application/json' },
          status: 200,
          // The pair stays expanded even though it held the largest value in the
          // payload: only the value itself was over its bound, not the structure.
          allRequestResponses: [{
            'Request Body': null,
            'Request Headers': { host: 'localhost' },
            'Request URL': 'http://localhost:3000/comments',
            'Response Body': withheld(pair['Response Body'].length),
            'Response Headers': { 'content-type': 'application/json' },
            'Response Status': 200,
          }],
        },
        expected: 'duration',
      },
      Message: 'expected { Object (body, headers, ...) } to have property duration',
    })
  })

  it('returns every value in full when asked for the full payload', () => {
    const consoleProps = responseConsoleProps()
    const result = LogUtils.toSerializedConsoleProps(consoleProps, { full: true })

    expect(result).toEqual(consoleProps)
  })

  it('bounds a string by its own length and a container by what would ship', () => {
    const result = LogUtils.toSerializedConsoleProps({
      props: {
        text: 'x'.repeat(1001),
        atBound: 'x'.repeat(1000),
        one: 'x',
        many: manyEntries(),
      },
    })

    expect(result.props.text).toEqual(withheld(1001))
    expect(result.props.atBound).toEqual('x'.repeat(1000))
    expect(result.props.one).toEqual('x')
    expect(result.props.many).toEqual(withheld(JSON.stringify(manyEntries()).length))
  })

  it('never names the payload root by its length, however long it is', () => {
    const result = LogUtils.toSerializedConsoleProps({
      first: 'x'.repeat(900),
      second: 'y'.repeat(900),
      third: manyEntries(),
    })

    // Collapsing the root would leave the caller with no payload to read at all.
    expect(Object.keys(result)).toEqual(['first', 'second', 'third'])
    expect(result.first).toEqual('x'.repeat(900))
    expect(result.third).toEqual(withheld(JSON.stringify(manyEntries()).length))
  })

  it('measures a container after its own children were bounded, not before', () => {
    // Two long strings, each named by its length, leave the object that holds
    // them small — so it survives rather than collapsing on their raw size.
    const result = LogUtils.toSerializedConsoleProps({
      props: { pair: { left: 'x'.repeat(9000), right: 'y'.repeat(9000) } },
    })

    expect(result.props.pair).toEqual({ left: withheld(9000), right: withheld(9000) })
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
