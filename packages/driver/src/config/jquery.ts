import JQuery from 'jquery'

import { scrollTo } from './jquery.scrollto'
import $dom from '../dom'

// Add missing types.
interface ExtendedJQueryStatic extends JQueryStatic {
  find: any
  expr: JQuery.Selectors
}

const $: ExtendedJQueryStatic = JQuery as any

$.fn.scrollTo = scrollTo

// Register custom pseudo-selectors on `$.expr.pseudos`, the canonical
// extension point. jQuery 4 removed the `$.expr.filters` and `$.expr[':']`
// aliases that older code wrote through, so we target `$.expr.pseudos` directly.
$.expr.pseudos.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused

// force jquery to have the same visible
// and hidden logic as cypress
// we have to add the arrow function here since
// jquery calls this function with additional parameters
// https://github.com/jquery/jquery/blob/master/src/selector.js#L1196
$.expr.pseudos.visible = (el) => $dom.isVisible(el)
$.expr.pseudos.hidden = (el) => $dom.isHidden(el)

// Back-compat shim: jQuery 4 removed the `$.expr[':']` alias for
// `$.expr.pseudos`. Restore it by reference so custom selectors registered
// through `Cypress.$.expr[':']` keep working. On jQuery 3 this reassigns the
// alias to the same object it already points at, so it is a no-op there.
$.expr[':'] = $.expr.pseudos

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false,
})
