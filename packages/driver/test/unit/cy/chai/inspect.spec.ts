/**
 * @vitest-environment node
 */

import { describe, it, expect, vi } from 'vitest'
import chai from 'chai'

import { create } from '../../../../src/cy/chai/inspect'

const { inspect } = create(chai)

describe('src/cy/chai/inspect', () => {
  describe('plain inspect method', () => {
    // https://github.com/cypress-io/cypress/issues/30662
    it('does not call an inspect method on the value', () => {
      const mw = {
        inspect () {
          throw new Error('mw.inspect() should not be called')
        },
        wgPageName: 'Main_Page',
      }

      expect(inspect(mw)).toBe(`{ inspect: [Function: inspect], wgPageName: 'Main_Page' }`)
    })

    it('does not call an inspect method on a nested value', () => {
      const library = {
        inspect () {
          throw new Error('library.inspect() should not be called')
        },
      }

      expect(inspect({ library })).toBe('{ library: { inspect: [Function: inspect] } }')
    })
  })

  describe.each([
    ['chai/inspect', Symbol.for('chai/inspect')],
    ['nodejs.util.inspect.custom', Symbol.for('nodejs.util.inspect.custom')],
  ])('Symbol.for(%s)', (_name, symbol) => {
    it('uses a string the custom inspector returns', () => {
      const user = { name: 'Jane Doe', [symbol]: () => 'User<jane.doe@example.com>' }

      expect(inspect(user)).toBe('User<jane.doe@example.com>')
    })

    it('formats a non-string value the custom inspector returns', () => {
      const user = { token: 'tok_8f3a2c9d1e7b', [symbol]: () => ({ name: 'Jane Doe' }) }

      expect(inspect(user)).toBe(`{ name: 'Jane Doe' }`)
    })

    it('calls the custom inspector with the value as this', () => {
      const customInspect = vi.fn(() => 'User<Jane Doe>')
      const user = { [symbol]: customInspect }

      inspect(user)

      expect(customInspect).toHaveBeenCalledTimes(1)
      expect(customInspect.mock.contexts[0]).toBe(user)
    })

    it('falls back to default formatting when the custom inspector returns the value itself', () => {
      const user = {
        name: 'Jane Doe',
        [symbol] () {
          return this
        },
      }

      expect(inspect(user)).toBe(`{ name: 'Jane Doe' }`)
    })

    it('uses a custom inspector on a nested value', () => {
      const session = { user: { [symbol]: () => 'User<Jane Doe>' } }

      expect(inspect(session)).toBe('{ user: User<Jane Doe> }')
    })

    it('uses a custom inspector inherited from a class', () => {
      class User {
        constructor (public name: string) {}

        [symbol] () {
          return `User<${this.name}>`
        }
      }

      expect(inspect(new User('Jane Doe'))).toBe('User<Jane Doe>')
    })

    it('does not call the custom inspector on the prototype it is defined on', () => {
      class User {
        [symbol] () {
          throw new Error('should not be called on the prototype')
        }
      }

      expect(inspect(User.prototype)).toBe('{}')
    })

    it('falls back to default formatting when the custom inspector throws', () => {
      const user = {
        name: 'Jane Doe',
        [symbol]: () => {
          throw new Error('custom inspector failed')
        },
      }

      expect(inspect(user)).toBe(`{ name: 'Jane Doe' }`)
    })

    it('falls back to default formatting when reading the custom inspector throws', () => {
      const user = Object.defineProperty({ name: 'Jane Doe' }, symbol, {
        get () {
          throw new Error('getter failed')
        },
      })

      expect(inspect(user)).toBe(`{ name: 'Jane Doe' }`)
    })
  })

  it('calls a Symbol.for(chai/inspect) method with options, as chai does', () => {
    const price = {
      cents: 500,
      [Symbol.for('chai/inspect')] (options) {
        return options.stylize(`$${this.cents / 100} (depth ${options.depth})`, 'number')
      },
    }

    expect(inspect(price)).toBe('$5 (depth 2)')
  })

  it('calls a Symbol.for(nodejs.util.inspect.custom) method with depth, options and inspect, as Node.js does', () => {
    const box = {
      contents: { name: 'Jane Doe' },
      [Symbol.for('nodejs.util.inspect.custom')] (depth, options, inspectValue) {
        return `Box<${depth}, ${options.depth}, ${inspectValue(this.contents, options)}>`
      },
    }

    expect(inspect(box)).toBe(`Box<2, 2, { name: 'Jane Doe' }>`)
  })

  it('formats a nested value with the depth a custom inspector passes', () => {
    const box = {
      contents: { user: { name: 'Jane Doe' } },
      [Symbol.for('nodejs.util.inspect.custom')] (depth, options, inspectValue) {
        return `Box<${inspectValue(this.contents, { ...options, depth: 0 })}>`
      },
    }

    expect(inspect(box)).toBe('Box<{ user: [Object] }>')
  })

  it('does not mark a value as circular after a custom inspector fails part-way through', () => {
    let failNextRead = true
    const address = new Proxy({ city: 'Springfield' }, {
      get (target, key, receiver) {
        if (failNextRead && key === 'city') {
          failNextRead = false
          throw new Error('address is not loaded yet')
        }

        return Reflect.get(target, key, receiver)
      },
    })
    const user = {
      address,
      [Symbol.for('nodejs.util.inspect.custom')] (depth, options, inspectValue) {
        return inspectValue(this.address, options)
      },
    }

    expect(inspect(user)).toBe(`{ address: { city: 'Springfield' } }`)
  })

  it('prefers Symbol.for(chai/inspect) over Symbol.for(nodejs.util.inspect.custom)', () => {
    const user = {
      [Symbol.for('chai/inspect')]: () => 'chai',
      [Symbol.for('nodejs.util.inspect.custom')]: () => 'node',
    }

    expect(inspect(user)).toBe('chai')
  })

  describe('ordinary values', () => {
    it.each([
      ['an object', { name: 'Jane Doe', age: 34 }, `{ name: 'Jane Doe', age: 34 }`],
      ['an array', [1, 'two', null], `[ 1, 'two', null ]`],
      ['a string', 'jane.doe@example.com', `'jane.doe@example.com'`],
      ['a number', 42, '42'],
      ['undefined', undefined, 'undefined'],
      ['null', null, 'null'],
      ['a named function', function getUser () {}, '[Function: getUser]'],
      ['a date', new Date(0), 'Thu, 01 Jan 1970 00:00:00 GMT'],
      ['an error', new Error('Request failed'), '[Error: Request failed]'],
    ])('formats %s', (_name, value, expected) => {
      expect(inspect(value)).toBe(expected)
    })
  })
})
