import _ from 'lodash'
import $dom from '../dom'
import $elements from '../dom/elements'
import type { Methods, PartialAssertionArgs } from './assertions/assert'
import { assert, assertDom, accessors, selectors, wrap } from './assertions/assert'

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

  const assertPartial = (
    ctx: Chai.AssertionStatic,
    chaiUtils: Chai.ChaiUtils,
    callbacks: Callbacks,
    method: Methods,
    actual: any,
    expected: any,
    ...[message, notMessage, ...args]: PartialAssertionArgs
  ) => {
    if (chaiUtils.flag(ctx, 'contains') || chaiUtils.flag(ctx, 'includes')) {
      return assert(
        ctx,
        chaiUtils,
        callbacks,
        method,
        _.includes(actual, expected),
        `expected #{this} to contain ${message}`,
        `expected #{this} not to contain ${notMessage}`,
        ...args,
      )
    }

    return assert(
      ctx,
      chaiUtils,
      callbacks,
      method,
      actual === expected,
      `expected #{this} to have ${message}`,
      `expected #{this} not to have ${notMessage}`,
      ...args,
    )
  }

  chai.Assertion.addMethod('data', function (...args) {
    // @ts-expect-error - Custom assertions expect messages for failures
    assertDom(this, chaiUtils, callbacks, 'data')

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
      chaiUtils,
      callbacks,
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
      chaiUtils,
      callbacks,
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
      chaiUtils,
      callbacks,
      'html',
      'expected #{this} to have HTML #{exp}',
      'expected #{this} not to have HTML #{exp}',
      html,
    )

    const actual = wrap(this).html()

    return assertPartial(
      this,
      chaiUtils,
      callbacks,
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
      chaiUtils,
      callbacks,
      'text',
      'expected #{this} to have text #{exp}',
      'expected #{this} not to have text #{exp}',
      text,
    )

    const actual = wrap(this).text()

    return assertPartial(
      this,
      chaiUtils,
      callbacks,
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
      chaiUtils,
      callbacks,
      'value',
      'expected #{this} to have value #{exp}',
      'expected #{this} not to have value #{exp}',
      value,
    )

    const actual = $el.val()

    return assertPartial(
      this,
      chaiUtils,
      callbacks,
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
      chaiUtils,
      callbacks,
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
          chaiUtils,
          callbacks,
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
          chaiUtils,
          callbacks,
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
        chaiUtils,
        callbacks,
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
        chaiUtils,
        callbacks,
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
          chaiUtils,
          callbacks,
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
          chaiUtils,
          callbacks,
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
