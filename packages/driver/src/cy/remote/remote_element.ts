import _ from 'lodash'
import $ from 'jquery'
import type { QueryStep, RemoteElementProps } from '../../remote/protocol'

const SUPPORTED_PSEUDOS = {
  ':visible': (el: RemoteElementProps) => el.visible,
  ':hidden': (el: RemoteElementProps) => !el.visible,
  ':checked': (el: RemoteElementProps) => el.checked,
  ':selected': (el: RemoteElementProps) => el.selected,
  ':disabled': (el: RemoteElementProps) => el.disabled,
  ':enabled': (el: RemoteElementProps) => !el.disabled,
  ':focus': (el: RemoteElementProps) => el.focused,
  ':focused': (el: RemoteElementProps) => el.focused,
  ':empty': (el: RemoteElementProps) => el.empty,
}

const PROPS = {
  id: (el: RemoteElementProps) => el.id,
  checked: (el: RemoteElementProps) => el.checked,
  selected: (el: RemoteElementProps) => el.selected,
  disabled: (el: RemoteElementProps) => el.disabled,
  value: (el: RemoteElementProps) => el.value,
  tagName: (el: RemoteElementProps) => el.tagName.toUpperCase(),
}

const unsupported = (what: string) => {
  const err = new Error(`\`${what}\` is not supported on a subject from \`experimentalRemoteDriver\`, since the element is in the AUT. Use \`.invoke()\` or \`.its()\` to run it there.`)

  // @ts-expect-error - retry is a Cypress error prop
  err.retry = false

  return err
}

// The subject a remote query yields: the query steps that find its elements in
// the AUT. Queries build it synchronously; the agent runs the steps when
// assertions or actions need the elements.
export class RemoteLocator {
  constructor (readonly steps: QueryStep[], readonly selector: string) {}

  extend (step: QueryStep, selector: string) {
    return new RemoteLocator([...this.steps, step], selector)
  }
}

// A locator together with a snapshot of what its steps found. It answers the
// subset of the jQuery API that the DOM assertions read.
export class RemoteElement extends RemoteLocator {
  readonly length: number

  constructor (locator: RemoteLocator, readonly elements: RemoteElementProps[]) {
    super(locator.steps, locator.selector)
    this.length = elements.length

    // the elements are in the AUT, so indexing fails loudly instead of yielding undefined
    elements.forEach((el, index) => {
      Object.defineProperty(this, index, {
        get: () => {
          throw unsupported(`[${index}]`)
        },
      })
    })
  }

  eq (index: number) {
    const resolvedIndex = index < 0 ? this.length + index : index
    const element = this.elements[resolvedIndex]

    return new RemoteElement(this.extend({ type: 'traversal', method: 'eq', args: [index] }, this.selector), element ? [element] : [])
  }

  first () {
    return this.eq(0)
  }

  last () {
    return this.eq(-1)
  }

  get node () {
    if (!this.length) {
      return this.selector
    }

    return this.length === 1 ? this.elements[0].node : `[${_.map(this.elements, 'node').join(', ')}]`
  }

  text () {
    return _.map(this.elements, 'text').join('')
  }

  html () {
    return this.elements[0]?.html
  }

  val () {
    return this.elements[0]?.value
  }

  hasClass (className: string) {
    return this.elements.some((el) => el.classes.includes(className))
  }

  attr (name: string) {
    return this.elements[0]?.attributes[name]
  }

  prop (name: string) {
    if (!PROPS[name]) {
      throw unsupported(`.prop('${name}')`)
    }

    return this.elements[0] ? PROPS[name](this.elements[0]) : undefined
  }

  is (selector: string) {
    const matches = SUPPORTED_PSEUDOS[selector]

    if (!matches) {
      throw unsupported(`.is('${selector}')`)
    }

    return this.elements.some(matches)
  }

  css (name: string): never {
    throw unsupported(`.css('${name}')`)
  }

  data (): never {
    throw unsupported('.data()')
  }

  has (selector: string): never {
    throw unsupported(`.has('${selector}')`)
  }
}

// Any other jQuery method a test calls on a snapshot fails with a clear error. Only methods are
// stubbed, so `jquery` stays undefined and the snapshot is never mistaken for a jQuery object.
Object.keys($.fn).forEach((name) => {
  if (typeof $.fn[name] !== 'function' || name in RemoteElement.prototype) {
    return
  }

  Object.defineProperty(RemoteElement.prototype, name, {
    value () {
      throw unsupported(`.${name}()`)
    },
  })
})

export const isRemoteSubject = (subject: unknown): subject is RemoteLocator => subject instanceof RemoteLocator

export const isRemoteElement = (subject: unknown): subject is RemoteElement => subject instanceof RemoteElement
