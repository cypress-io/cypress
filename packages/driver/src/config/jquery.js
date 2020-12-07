const $ = require('jquery')
const _ = require('lodash')

require('jquery.scrollto')

const $dom = require('../dom')

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
      throw e
    },
    finallyFn () {
      if (isUsingFocus) {
        $.find.support.matchesSelector = supportMatchesSelector
      }
    },
  })
}

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
