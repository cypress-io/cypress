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

    it('calls the custom inspector with the value as this, the depth and the context', () => {
      const customInspect = vi.fn(function (this: unknown) {
        return 'User<Jane Doe>'
      })
      const user = { [symbol]: customInspect }

      inspect(user)

      expect(customInspect).toHaveBeenCalledTimes(1)
      expect(customInspect.mock.contexts[0]).toBe(user)
      expect(customInspect.mock.calls[0]).toEqual([2, expect.objectContaining({ stylize: expect.any(Function) })])
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
