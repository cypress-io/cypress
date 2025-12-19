import $dom from '../../dom'
import $ from 'jquery'

export const selectors = {
  visible: 'visible',
  hidden: 'hidden',
  selected: 'selected',
  checked: 'checked',
  enabled: 'enabled',
  disabled: 'disabled',
  focus: 'focused',
  focused: 'focused',
} as const

export const accessors = {
  attr: 'attribute',
  css: 'CSS property',
  prop: 'property',
} as const

export type Accessors = keyof typeof accessors

export type Selectors = keyof typeof selectors

export type Methods = Accessors | Selectors | 'data' | 'class' | 'empty' | 'id' | 'html' | 'text' | 'value' | 'descendants' | 'match'

export type PartialAssertionArgs = [Chai.Message, Chai.Message, any?, any?, boolean?]

export interface Callbacks {
  onInvalid: (method, obj) => void
  onError: (err, method, obj, negated) => void
}

// reset the obj under test
// to be re-wrapped in our own
// jquery, so we can control
// the methods on it
export const wrap = (ctx) => $(ctx._obj)

export function assertDom (ctx: Chai.AssertionStatic, utils: Chai.ChaiUtils, callbacks: Callbacks, method: Methods, ...args: PartialAssertionArgs) {
  if (!$dom.isDom(ctx._obj) && !$dom.isJquery(ctx._obj)) {
    try {
      // always fail the assertion
      // if we aren't a DOM like object
      // depends on the "negate" flag
      const negate = utils.flag(ctx, 'negate')

      return ctx.assert(!!negate, ...args)
    } catch (err) {
      return callbacks.onInvalid(method, ctx._obj)
    }
  }
}

export function assert (ctx: Chai.AssertionStatic, utils: Chai.ChaiUtils, callbacks: Callbacks, method: Methods, ...[bool, ...args]: Chai.AssertionArgs) {
  assertDom(ctx, utils, callbacks, method, ...args)

  try {
    // reset obj to wrapped
    const orig = ctx._obj
    const selector = ctx._obj.selector

    ctx._obj = wrap(ctx)

    if (ctx._obj.length === 0) {
      // From jQuery 3.x .selector API is deprecated. (https://api.jquery.com/selector/)
      // Because of that, wrap() above removes selector property.
      // That's why we're caching the value of selector above and using it here.
      ctx._obj = selector ?? 'subject'
      // if no element found, fail the existence check
      // depends on the negate flag
      ctx.assert(!!utils.flag(ctx, 'negate'), ...args)
    }

    // apply the assertion
    const ret = ctx.assert(bool, ...args)

    ctx._obj = orig

    return ret
  } catch (err) {
    // send it up with the obj and whether it was negated
    return callbacks.onError(err, method, ctx._obj, utils.flag(ctx, 'negate'))
  }
}
