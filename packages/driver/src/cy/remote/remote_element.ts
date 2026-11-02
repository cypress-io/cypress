import _ from 'lodash'
import $ from 'jquery'
import type { QueryStep, RemoteElementProps, RemoteReads } from '../../remote/protocol'

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

// a compound of a tag, ids and classes, which the snapshot can answer without the AUT
const SIMPLE_SELECTOR = /^([a-z][\w-]*|\*)?((?:[#.][\w-]+)*)$/i

const matchesSimpleSelector = (el: RemoteElementProps, selector: string) => {
  const [, tag, rest] = SIMPLE_SELECTOR.exec(selector) ?? []

  if (tag && tag !== '*' && tag.toLowerCase() !== el.tagName.toLowerCase()) {
    return false
  }

  return (rest.match(/[#.][\w-]+/g) ?? []).every((part) => {
    return part[0] === '#' ? el.id === part.slice(1) : el.classes.includes(part.slice(1))
  })
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

  // reads, when given, collects what the snapshot lacked, for a retrying assertion's next attempt to read
  constructor (locator: RemoteLocator, readonly elements: RemoteElementProps[], readonly reads?: RemoteReads) {
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

    return new RemoteElement(this.extend({ type: 'traversal', method: 'eq', args: [index] }, this.selector), element ? [element] : [], this.reads)
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
    const matchers = selector.split(',').map((part) => {
      const trimmed = part.trim()

      if (SUPPORTED_PSEUDOS[trimmed]) {
        return SUPPORTED_PSEUDOS[trimmed]
      }

      if (trimmed && SIMPLE_SELECTOR.test(trimmed)) {
        return (el: RemoteElementProps) => matchesSimpleSelector(el, trimmed)
      }

      throw unsupported(`.is('${selector}')`)
    })

    return this.elements.some((el) => matchers.some((matches) => matches(el)))
  }

  css (name: string) {
    if (typeof name !== 'string') {
      throw unsupported('.css()')
    }

    const el = this.elements[0]

    if (!el) {
      return undefined
    }

    if (!el.styles || !(name in el.styles)) {
      throw this.unread('styles', name, `.css('${name}')`)
    }

    return el.styles[name]
  }

  // jQuery reads data from data-* attributes, which the snapshot has, so a detached element answers it
  data (key?: string) {
    const el = this.elements[0]

    if (!el) {
      return undefined
    }

    const detached = document.createElement('div')

    _.each(el.attributes, (value, name) => {
      if (name.startsWith('data-')) {
        detached.setAttribute(name, value)
      }
    })

    return key === undefined ? $(detached).data() : $(detached).data(key)
  }

  has (selector: string) {
    if (typeof selector !== 'string') {
      throw unsupported('.has()')
    }

    if (this.elements.some((el) => !el.descendants || !(selector in el.descendants))) {
      throw this.unread('descendants', selector, `.has('${selector}')`)
    }

    return new RemoteElement(this.extend({ type: 'traversal', method: 'has', args: [selector] }, this.selector), this.elements.filter((el) => el.descendants![selector]), this.reads)
  }

  private unread (kind: keyof RemoteReads, value: string, what: string) {
    if (!this.reads) {
      return unsupported(what)
    }

    if (!this.reads[kind].includes(value)) {
      this.reads[kind].push(value)
    }

    return new Error(`\`${what}\` hasn't been read from the AUT yet.`)
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
