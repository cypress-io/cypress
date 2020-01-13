const _ = require('lodash')
const $ = require('jquery')
const $dom = require('../dom')

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

const attrs = {
  attr: 'attribute',
  css: 'CSS property',
  prop: 'property',
}

// reset the obj under test
// to be re-wrapped in our own
// jquery, so we can control
// the methods on it
const wrap = (ctx) => $(ctx._obj)

const $chaiJquery = (chai, chaiUtils, callbacks = {}) => {
  const { inspect, flag } = chaiUtils

  const assertDom = (ctx, method, ...args) => {
    if (!$dom.isDom(ctx._obj)) {
      try {
        // always fail the assertion
        // if we aren't a DOM like object
        return ctx.assert(false, ...args)
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

      ctx._obj = wrap(ctx)

      if (ctx._obj.length === 0) {
        ctx._obj = ctx._obj.selector
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
        ...args
      )
    }

    return assert(
      ctx,
      method,
      actual === expected,
      `expected #{this} to have ${message}`,
      `expected #{this} not to have ${notMessage}`,
      ...args
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
      className
    )
  })

  chai.Assertion.addMethod('id', function (id) {
    return assert(
      this,
      'id',
      wrap(this).prop('id') === id,
      'expected #{this} to have id #{exp}',
      'expected #{this} not to have id #{exp}',
      id
    )
  })

  chai.Assertion.addMethod('html', function (html) {
    assertDom(
      this,
      'html',
      'expected #{this} to have HTML #{exp}',
      'expected #{this} not to have HTML #{exp}',
      html
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
      actual
    )
  })

  chai.Assertion.addMethod('text', function (text) {
    assertDom(
      this,
      'text',
      'expected #{this} to have text #{exp}',
      'expected #{this} not to have text #{exp}',
      text
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
      actual
    )
  })

  chai.Assertion.addMethod('value', function (value) {
    assertDom(
      this,
      'value',
      'expected #{this} to have value #{exp}',
      'expected #{this} not to have value #{exp}',
      value
    )

    const actual = wrap(this).val()

    return assertPartial(
      this,
      'value',
      actual,
      value,
      'value #{exp}, but the value was #{act}',
      'value #{exp}',
      value,
      actual
    )
  })

  chai.Assertion.addMethod('descendants', function (selector) {
    return assert(
      this,
      'descendants',
      wrap(this).has(selector).length > 0,
      'expected #{this} to have descendants #{exp}',
      'expected #{this} not to have descendants #{exp}',
      selector
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
          'empty'
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
          selector
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
        selectorName
      )
    })
  })

  _.each(attrs, (description, attr) => {
    return chai.Assertion.addMethod(attr, function (name, val) {
      assertDom(
        this,
        attr,
        `expected #{this} to have ${description} #{exp}`,
        `expected #{this} not to have ${description} #{exp}`,
        name
      )

      const actual = wrap(this)[attr](name)

      // when we only have 1 argument dont worry about val
      if (arguments.length === 1) {
        assert(
          this,
          attr,
          actual !== undefined,
          `expected #{this} to have ${description} #{exp}`,
          `expected #{this} not to have ${description} #{exp}`,
          name
        )

        // change the subject
        this._obj = actual
      } else {
        // if we don't have an attribute here at all we need to
        // have a different failure message
        let message; let negatedMessage

        if (_.isUndefined(actual)) {
          message = `expected \#{this} to have ${description} ${inspect(name)}`

          negatedMessage = `expected \#{this} not to have ${description} ${inspect(name)}`
        } else {
          message = `expected \#{this} to have ${description} ${inspect(name)} with the value \#{exp}, but the value was \#{act}`

          negatedMessage = `expected \#{this} not to have ${description} ${inspect(name)} with the value \#{exp}, but the value was \#{act}`
        }

        assert(
          this,
          attr,
          (actual != null) && (actual === val),
          message,
          negatedMessage,
          val,
          actual
        )
      }

      return this
    })
  })
}

module.exports = $chaiJquery
