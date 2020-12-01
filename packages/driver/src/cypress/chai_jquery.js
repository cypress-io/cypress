const _ = require('lodash')
const $ = require('jquery')
const $dom = require('../dom')
const $elements = require('../dom/elements')

const selectors = {
  visible: 'visible',
  hidden: 'hidden',
  selected: 'selected',
  checked: 'checked',
  enabled: 'enabled',
  disabled: 'disabled',
  focus: 'focused',
  focused: 'focused',
}

const accessors = {
  attr: 'attribute',
  css: 'CSS property',
  prop: 'property',
}

// reset the obj under test
// to be re-wrapped in our own
// jquery, so we can control
// the methods on it
const wrap = (ctx) => $(ctx._obj)

const maybeCastNumberToString = (num) => {
  // if this is a finite number (no Infinity or NaN)
  // cast to a string
  return _.isFinite(num) ? `${num}` : num
}

const $chaiJquery = (chai, chaiUtils, callbacks = {}) => {
  const { inspect, flag } = chaiUtils

  const assertDom = (ctx, method, ...args) => {
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

  const assert = (ctx, method, bool, ...args) => {
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
        ctx._obj = selector
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

  const assertPartial = (ctx, method, actual, expected, message, notMessage, ...args) => {
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

    return a.property.apply(a, args)
  })

  chai.Assertion.addMethod('class', function (className) {
    return assert(
      this,
      'class',
      wrap(this).hasClass(className),
      'expected #{this} to have class #{exp}',
      'expected #{this} not to have class #{exp}',
      className,
    )
  })

  chai.Assertion.addMethod('id', function (id) {
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

  chai.Assertion.addMethod('html', function (html) {
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

  chai.Assertion.addMethod('text', function (text) {
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

  chai.Assertion.addMethod('value', function (value) {
    const $el = wrap(this)

    // some elements return a number for the .value property
    // in this case, we don't want to cast the expected value to a string
    if (!$elements.isValueNumberTypeElement($el[0])) {
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

  chai.Assertion.addMethod('descendants', function (selector) {
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
      const selector = args[0]

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
    return chai.Assertion.addProperty(selector, function () {
      return assert(
        this,
        selector,
        wrap(this).is(`:${selector}`),
        'expected #{this} to be #{exp}',
        'expected #{this} not to be #{exp}',
        selectorName,
      )
    })
  })

  _.each(accessors, (description, accessor) => {
    return chai.Assertion.addMethod(accessor, function (name, val) {
      assertDom(
        this,
        accessor,
        `expected #{this} to have ${description} #{exp}`,
        `expected #{this} not to have ${description} #{exp}`,
        name,
      )

      const actual = wrap(this)[accessor](name)

      // when we only have 1 argument dont worry about val
      if (arguments.length === 1) {
        assert(
          this,
          accessor,
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
        let message; let negatedMessage

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
        if (accessor === 'attr') {
          val = maybeCastNumberToString(val)
        }

        assert(
          this,
          accessor,
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

module.exports = $chaiJquery
