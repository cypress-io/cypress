import JQuery from 'jquery'
import _ from 'lodash'

import { scrollTo } from './jquery.scrollto'
import $dom from '../dom'

// Add missing types.
interface ExtendedJQueryStatic extends JQueryStatic {
  find: any
  expr: JQuery.Selectors & { filters: any }
}

const $: ExtendedJQueryStatic = JQuery as any

// force jquery to have the same visible
// and hidden logic as cypress

// this prevents `is` from calling into the native .matches method
// which would prevent our `focus` code from ever being called during
// is(:focus).
// see https://github.com/jquery/sizzle/wiki#sizzlematchesselector-domelement-element-string-selector-

// this is to help to interpretor make optimizations around try/catch
const tryCatchFinally = function ({ tryFn, catchFn, finallyFn }) {
  try {
    return tryFn()
  } catch (e) {
    return catchFn(e)
  } finally {
    finallyFn()
  }
}

const { matchesSelector } = $.find

$.find.matchesSelector = function (elem, expr) {
  let supportMatchesSelector
  const isUsingFocus = _.includes(expr, ':focus')

  if (isUsingFocus) {
    supportMatchesSelector = $.find.support.matchesSelector
    $.find.support.matchesSelector = false
  }

  // eslint-disable-next-line prefer-rest-params
  const args = arguments
  const _this = this

  return tryCatchFinally({
    tryFn () {
      return matchesSelector.apply(_this, args)
    },
    catchFn (e) {
      // https://github.com/cypress-io/cypress/issues/21108
      // When regex starts with =, it is a syntax error when nothing found.
      // Because Sizzle internally escapes = to handle attribute selectors.
      // @see https://github.com/jquery/sizzle/blob/20390f05731af380833b5aa805db97de0b91268a/external/jquery/jquery.js#L4363-L4370
      if (e.message.includes(`Syntax error, unrecognized expression: :cy-contains`)) {
        return false
      }

      throw e
    },
    finallyFn () {
      if (isUsingFocus) {
        $.find.support.matchesSelector = supportMatchesSelector
      }
    },
  })
}

$.fn.scrollTo = scrollTo

// see difference between 'filters' and 'pseudos'
// https://api.jquery.com/filter/ and https://api.jquery.com/category/selectors/

$.expr.pseudos.focus = $dom.isFocused
$.expr.filters.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused

// we have to add the arrow function here since
// jquery calls this function with additional parameters
// https://github.com/jquery/jquery/blob/master/src/selector.js#L1196
$.expr.filters.visible = (el) => $dom.isVisible(el)
$.expr.filters.hidden = (el) => $dom.isHidden(el)

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false,
})
