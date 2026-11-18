import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// The proxy mirrors the wrapped module, so it's callable and constructible when
// the default export is a function
type CypressModule = (id: string, module: Record<string, unknown>) => any

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

    it('constructs a default-exported class with its arguments', () => {
      class Store {
        constructor (public name: string, public capacity: number) {}
      }

      const DefaultStore = cypressModule('default-class', { default: Store })
      const store = new DefaultStore('Riverside Pantry', 3)

      expect(store).toBeInstanceOf(Store)
      expect(store).toBeInstanceOf(DefaultStore)
      expect(store).toMatchObject({ name: 'Riverside Pantry', capacity: 3 })
    })

    it('constructs a subclass of an exported constructor function', () => {
      // Mirrors `class Greeting extends React.Component`, where `Component` is a plain function
      function Widget (this: { props: unknown }, props: unknown) {
        this.props = props
      }

      type Props = { name: string }

      const ui: { Widget: new (props: Props) => { props: Props } } = cypressModule('react-like', { Widget })

      class Greeting extends ui.Widget {
        greet () {
          return `Hello, ${this.props.name}`
        }
      }

      const greeting = new Greeting({ name: 'Amara Okafor' })

      expect(greeting.greet()).toBe('Hello, Amara Okafor')
      expect(greeting).toBeInstanceOf(Widget)
    })

    it('constructs a subclass of a default-exported class', () => {
      class Store {
        constructor (public name: string) {}

        label () {
          return `Store: ${this.name}`
        }
      }

      const DefaultStore: typeof Store = cypressModule('default-base-class', { default: Store })

      class Outlet extends DefaultStore {
        label () {
          return `Outlet of ${super.label()}`
        }
      }

      expect(new Outlet('Riverside Pantry').label()).toBe('Outlet of Store: Riverside Pantry')
    })

    it('calls a default-exported function', () => {
      function formatPrice (cents: number, currency: string) {
        return `${(cents / 100).toFixed(2)} ${currency}`
      }

      const format = cypressModule('default-function', { default: formatPrice })

      expect(format(1999, 'EUR')).toBe('19.99 EUR')
    })

    it('constructs a class assigned after the proxy is created', () => {
      const ns = cypressModule('late-class', {})

      ns.Invoice = class Invoice {
        constructor (public id: string) {}
      }

      const invoice = new ns.Invoice('inv_4q7Zp2Lm')

      expect(invoice).toBeInstanceOf(ns.Invoice)
      expect(invoice).toMatchObject({ id: 'inv_4q7Zp2Lm' })
    })

    it('calls a function assigned after the proxy is created', () => {
      const ns = cypressModule('late-function', {})

      ns.greet = function (this: { salutation: string }, name: string) {
        return `${this.salutation}, ${name}`
      }

      expect(ns.greet.call({ salutation: 'Hello' }, 'Amara Okafor')).toBe('Hello, Amara Okafor')
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

    it('calls a function without the Function prototype with each argument', () => {
      function add (a: number, b: number) {
        return a + b
      }

      Object.setPrototypeOf(add, null)

      const ns = cypressModule('null-prototype-function', { add })

      expect(ns.add(1, 2)).toBe(3)
    })
  })
})
