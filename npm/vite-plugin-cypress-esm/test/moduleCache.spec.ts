import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

type CypressModule = (id: string, module: Record<string, unknown>) => Record<string, any>

let cypressModule: CypressModule

beforeAll(async () => {
  // The client is browser code that registers its entry points on `window`
  vi.stubGlobal('window', globalThis)
  await import('../client/moduleCache.js')
  cypressModule = Reflect.get(globalThis, '__cypressModule')
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// The spec's TypeScript transform reformats `{}` to `{\n}`, so build these from
// source to keep the exact text that bundled and minified libraries ship
const fromSource = (source: string): any => {
  return new Function(`return ${source}`)()
}

describe('__cypressModule', () => {
  describe('class exports', () => {
    it('constructs a named class', () => {
      const ns = cypressModule('named-class', {
        Greeter: class Greeter {
          greet () {
            return 'named'
          }
        },
      })

      expect(new ns.Greeter().greet()).toBe('named')
    })

    it('constructs an anonymous class', () => {
      const ns = cypressModule('anonymous-class', {
        Greeter: class {
          greet () {
            return 'anonymous'
          }
        },
      })

      expect(new ns.Greeter().greet()).toBe('anonymous')
    })

    it('constructs a class that extends another', () => {
      class Base {
        greet () {
          return 'base'
        }
      }

      const ns = cypressModule('derived-class', {
        Derived: class Derived extends Base {
          greet () {
            return `derived ${super.greet()}`
          }
        },
      })

      expect(new ns.Derived().greet()).toBe('derived base')
    })

    it('passes constructor arguments through', () => {
      const ns = cypressModule('class-args', {
        Point: class Point {
          constructor (public x: number, public y: number) {}
        },
      })

      expect(new ns.Point(1, 2)).toMatchObject({ x: 1, y: 2 })
    })

    it('constructs a named class with an empty body', () => {
      const Empty = fromSource('class Empty {}')

      const ns = cypressModule('empty-named-class', { Empty })

      expect(new ns.Empty()).toBeInstanceOf(Empty)
    })

    it('constructs an anonymous class with an empty body', () => {
      const Empty = fromSource('class {}')

      const ns = cypressModule('empty-anonymous-class', { Empty })

      expect(new ns.Empty()).toBeInstanceOf(Empty)
    })

    it('constructs an empty-bodied error subclass', () => {
      const NotFoundError = fromSource('class NotFoundError extends Error {}')

      const ns = cypressModule('empty-error-class', { NotFoundError })
      const error = new ns.NotFoundError('Order ord_8f3k2m9x was not found')

      expect(error).toBeInstanceOf(NotFoundError)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Order ord_8f3k2m9x was not found')
    })

    it('constructs a constructor function invoked with `new`', () => {
      function Account (this: { owner: string }, owner: string) {
        this.owner = owner
      }

      const ns = cypressModule('constructor-function', { Account })

      expect(new ns.Account('Priya Raman')).toMatchObject({ owner: 'Priya Raman' })
    })
  })

  describe('function exports', () => {
    it('calls a function declaration with its arguments', () => {
      function add (a: number, b: number) {
        return a + b
      }

      const ns = cypressModule('function', { add })

      expect(ns.add(1, 2)).toBe(3)
    })

    it('calls an arrow function', () => {
      const ns = cypressModule('arrow', { double: (n: number) => n * 2 })

      expect(ns.double(4)).toBe(8)
    })

    it('calls a function whose body mentions a class', () => {
      function makeClassName (name: string) {
        return `class ${name} { }`
      }

      const ns = cypressModule('function-mentions-class', { makeClassName })

      expect(ns.makeClassName('A')).toBe('class A { }')
    })

    it('calls a shorthand method named `class`', () => {
      const helpers = fromSource('{ class (name) { return `btn-${name}` } }')

      const ns = cypressModule('method-named-class', { default: helpers })

      expect(ns.class('primary')).toBe('btn-primary')
    })
  })
})
