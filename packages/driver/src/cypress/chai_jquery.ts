import _ from 'lodash'
import $ from 'jquery'
import $dom from '../dom'
import $elements from '../dom/elements'

type Accessors = keyof typeof accessors
type Selectors = keyof typeof selectors
type Methods = Accessors | Selectors | 'data' | 'class' | 'empty' | 'id' | 'html' | 'text' | 'value' | 'descendants' | 'match'

const selectors = {
  visible: 'visible',
  hidden: 'hidden',
  selected: 'selected',
  checked: 'checked',
  enabled: 'enabled',
  disabled: 'disabled',
  focus: 'focused',
  focused: 'focused',
} as const

const accessors = {
  attr: 'attribute',
  css: 'CSS property',
  prop: 'property',
} as const

// reset the obj under test
// to be re-wrapped in our own
// jquery, so we can control
// the methods on it
const wrap = (ctx) => $(ctx._obj)

const maybeCastNumberToString = (num: number | string) => {
  // if this is a finite number (no Infinity or NaN)
  // cast to a string
  return _.isFinite(num) ? `${num}` : num
}

interface Callbacks {
  onInvalid: (method, obj) => void
  onError: (err, method, obj, negated) => void
}

export const $chaiJquery = (chai: Chai.ChaiStatic, chaiUtils: Chai.ChaiUtils, callbacks: Callbacks) => {
  const { inspect, flag } = chaiUtils

  const assertDom = (ctx, method: Methods, ...args) => {
    if (!$dom.isDom(ctx._obj) && !$dom.isJquery(ctx._obj)) {
      try {
        // always fail the assertion
        // if we aren't a DOM like object
        // depends on the "negate" flag
        return ctx.assert(!!ctx.__flags.negate, ...args)
      } catch (err) {
        return callbacks.onInvalid(method, ctx._obj)
      }
    }
  }

  const assert = (ctx, method: Methods, bool: boolean, ...args) => {
    assertDom(ctx, method, ...args)

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
        ctx.assert(!!ctx.__flags.negate, ...args)
      }

      // apply the assertion
      const ret = ctx.assert(bool, ...args)

      ctx._obj = orig

      return ret
    } catch (err) {
      // send it up with the obj and whether it was negated
      return callbacks.onError(err, method, ctx._obj, flag(ctx, 'negate'))
    }
  }

  const assertPartial = (ctx, method: Methods, actual, expected, message: string, notMessage: string, ...args) => {
    if (ctx.__flags.contains || ctx.__flags.includes) {
      return assert(
        ctx,
        method,
        _.includes(actual, expected),
        `expected #{this} to contain ${message}`,
        `expected #{this} not to contain ${notMessage}`,
        ...args,
      )
    }

    return assert(
      ctx,
      method,
      actual === expected,
      `expected #{this} to have ${message}`,
      `expected #{this} not to have ${notMessage}`,
      ...args,
    )
  }

  chai.Assertion.addMethod('data', function (...args) {
    assertDom(this, 'data')

    let a = new chai.Assertion(wrap(this).data())

    if (flag(this, 'negate')) {
      a = a.not
    }

    // @ts-expect-error - TODO: Fix this
    return a.property.apply(a, args)
  })

  chai.Assertion.addMethod('class', function (className: string) {
    return assert(
      this,
      'class',
      wrap(this).hasClass(className),
      'expected #{this} to have class #{exp}',
      'expected #{this} not to have class #{exp}',
      className,
    )
  })

  chai.Assertion.addMethod('id', function (id: string | number) {
    id = maybeCastNumberToString(id)

    return assert(
      this,
      'id',
      wrap(this).prop('id') === id,
      'expected #{this} to have id #{exp}',
      'expected #{this} not to have id #{exp}',
      id,
    )
  })

  chai.Assertion.addMethod('html', function (html: string) {
    assertDom(
      this,
      'html',
      'expected #{this} to have HTML #{exp}',
      'expected #{this} not to have HTML #{exp}',
      html,
    )

    const actual = wrap(this).html()

    return assertPartial(
      this,
      'html',
      actual,
      html,
      'HTML #{exp}, but the HTML was #{act}',
      'HTML #{exp}',
      html,
      actual,
    )
  })

  chai.Assertion.addMethod('text', function (text: string | number) {
    text = maybeCastNumberToString(text)

    assertDom(
      this,
      'text',
      'expected #{this} to have text #{exp}',
      'expected #{this} not to have text #{exp}',
      text,
    )

    const actual = wrap(this).text()

    return assertPartial(
      this,
      'text',
      actual,
      text,
      'text #{exp}, but the text was #{act}',
      'text #{exp}',
      text,
      actual,
    )
  })

  chai.Assertion.addMethod('value', function (value: string | number) {
    const $el = wrap(this)

    // some elements return a number for the .value property
    // in this case, we don't want to cast the expected value to a string
    if ($el[0] && !$elements.isValueNumberTypeElement($el[0])) {
      value = maybeCastNumberToString(value)
    }

    assertDom(
      this,
      'value',
      'expected #{this} to have value #{exp}',
      'expected #{this} not to have value #{exp}',
      value,
    )

    const actual = $el.val()

    return assertPartial(
      this,
      'value',
      actual,
      value,
      'value #{exp}, but the value was #{act}',
      'value #{exp}',
      value,
      actual,
    )
  })

  chai.Assertion.addMethod('descendants', function (selector: string) {
    return assert(
      this,
      'descendants',
      wrap(this).has(selector).length > 0,
      'expected #{this} to have descendants #{exp}',
      'expected #{this} not to have descendants #{exp}',
      selector,
    )
  })

  chai.Assertion.overwriteProperty('empty', (_super) => {
    return (function (...args) {
      if ($dom.isDom(this._obj)) {
        return assert(
          this,
          'empty',
          wrap(this).is(':empty'),
          'expected #{this} to be #{exp}',
          'expected #{this} not to be #{exp}',
          'empty',
        )
      }

      return _super.apply(this, args)
    })
  })

  chai.Assertion.overwriteMethod('match', (_super) => {
    return (function (...args) {
      const selector: string = args[0]

      if ($dom.isDom(this._obj)) {
        return assert(
          this,
          'match',
          wrap(this).is(selector),
          'expected #{this} to match #{exp}',
          'expected #{this} not to match #{exp}',
          selector,
        )
      }

      return _super.apply(this, args)
    })
  })

  _.each(selectors, (selectorName, selector) => {
    const sel = selector as keyof typeof selectors

    return chai.Assertion.addProperty(sel, function () {
      return assert(
        this,
        sel,
        wrap(this).is(`:${sel}`),
        'expected #{this} to be #{exp}',
        'expected #{this} not to be #{exp}',
        selectorName,
      )
    })
  })

  _.each(accessors, (description, accessor) => {
    const acc = accessor as keyof typeof accessors

    return chai.Assertion.addMethod(acc, function (name, val) {
      assertDom(
        this,
        acc,
        `expected #{this} to have ${description} #{exp}`,
        `expected #{this} not to have ${description} #{exp}`,
        name,
      )

      const actual = wrap(this)[acc](name)

      // when we only have 1 argument dont worry about val
      if (arguments.length === 1) {
        assert(
          this,
          acc,
          actual !== undefined,
          `expected #{this} to have ${description} #{exp}`,
          `expected #{this} not to have ${description} #{exp}`,
          name,
        )

        // change the subject
        this._obj = actual
      } else {
        // if we don't have an accessor here at all we need to
        // have a different failure message
        let message: string
        let negatedMessage: string

        if (_.isUndefined(actual)) {
          message = `expected \#{this} to have ${description} ${inspect(name)}`

          negatedMessage = `expected \#{this} not to have ${description} ${inspect(name)}`
        } else {
          message = `expected \#{this} to have ${description} ${inspect(name)} with the value \#{exp}, but the value was \#{act}`

          negatedMessage = `expected \#{this} not to have ${description} ${inspect(name)} with the value \#{exp}, but the value was \#{act}`
        }

        // only cast .attr() as a string
        // since prop stores the native javascript type
        // and we don't want to optimistically cast those
        // values as a string
        if (acc === 'attr') {
          val = maybeCastNumberToString(val)
        }

        assert(
          this,
          acc,
          (actual != null) && (actual === val),
          message,
          negatedMessage,
          val,
          actual,
        )
      }

      return this
    })
  })
}

export default $chaiJquery
