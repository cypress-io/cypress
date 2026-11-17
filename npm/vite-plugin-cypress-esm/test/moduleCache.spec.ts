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
  })
})
