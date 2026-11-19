import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import debugLib from 'debug'
import { format } from 'util'
import { autoBindDebug } from '../../../src/util/autoBindDebug'

class Counter {
  count = 0

  constructor () {
    return autoBindDebug(this)
  }

  add (n: number) {
    this.count += n

    return this.count
  }
}

describe('autoBindDebug', () => {
  let logged: string[]
  let ambientNamespaces: string

  // debug's enable/disable write through to process.env.DEBUG, which the rest of
  // the run shares, so put back whatever namespaces the run started with
  beforeAll(() => {
    ambientNamespaces = debugLib.disable()
  })

  afterAll(() => {
    debugLib.enable(ambientNamespaces)
  })

  beforeEach(() => {
    logged = []
    debugLib.disable()
    // debug leaves `%s` for its default log function, which formats with util.format
    jest.spyOn(debugLib, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(format(...args))
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the object untouched when tracing is off', () => {
    const counter = new Counter()

    expect(Object.prototype.hasOwnProperty.call(counter, 'add')).toBe(false)
    expect(counter.add(2)).toBe(2)
    expect(logged).toEqual([])
  })

  describe('with tracing on', () => {
    beforeEach(() => {
      debugLib.enable('trace-cypress:*')
    })

    it('wraps prototype methods, keeping their result and `this`', () => {
      const counter = new Counter()

      expect(Object.prototype.hasOwnProperty.call(counter, 'add')).toBe(true)
      expect(counter.add.name).toBe('')
      expect(counter.add(2)).toBe(2)
      expect(counter.add(3)).toBe(5)
      expect(counter.count).toBe(5)
      expect(logged.some((line) => line.includes('calling add with args'))).toBe(true)
    })

    it('logs and applies property writes', () => {
      const counter = new Counter()

      counter.count = 10

      expect(counter.count).toBe(10)
      expect(logged.some((line) => line.includes('set count to'))).toBe(true)
    })

    it('throws when it cannot install a wrapper', () => {
      class Frozen {
        constructor () {
          Object.freeze(this)

          return autoBindDebug(this)
        }

        run () {}
      }

      expect(() => new Frozen()).toThrow(TypeError)
    })
  })
})
