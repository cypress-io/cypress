/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const $ = require('jquery')

require('jquery.scrollto')
const _ = require('lodash')

const $dom = require('../dom')
// const $elements = require('../dom/elements')

//# force jquery to have the same visible
//# and hidden logic as cypress

//# this prevents `is` from calling into the native .matches method
//# which would prevent our `focus` code from ever being called during
//# is(:focus).
//# see https://github.com/jquery/sizzle/wiki#sizzlematchesselector-domelement-element-string-selector-

//# this is to help to interpretor make optimizations around try/catch
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
        return $.find.support.matchesSelector = supportMatchesSelector
      }
    },
  })
}

//# see difference between 'filters' and 'pseudos'
//# https://api.jquery.com/filter/ and https://api.jquery.com/category/selectors/

$.expr.pseudos.focus = $dom.isFocused
$.expr.filters.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused
$.expr.filters.visible = $dom.isVisible
$.expr.filters.hidden = $dom.isHidden

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false,
})
