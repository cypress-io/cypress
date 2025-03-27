import JQuery from 'jquery'

import { scrollTo } from './jquery.scrollto'
import $dom from '../dom'

// Add missing types.
interface ExtendedJQueryStatic extends JQueryStatic {
  find: any
  expr: JQuery.Selectors & { filters: any }
}

const $: ExtendedJQueryStatic = JQuery as any

$.fn.scrollTo = scrollTo

// see difference between 'filters' and 'pseudos'
// https://api.jquery.com/filter/ and https://api.jquery.com/category/selectors/

$.expr.pseudos.focus = $dom.isFocused
$.expr.filters.focus = $dom.isFocused
$.expr.pseudos.focused = $dom.isFocused

// force jquery to have the same visible
// and hidden logic as cypress
// we have to add the arrow function here since
// jquery calls this function with additional parameters
// https://github.com/jquery/jquery/blob/master/src/selector.js#L1196
$.expr.filters.visible = (el) => $dom.isVisible(el)
$.expr.filters.hidden = (el) => $dom.isHidden(el)

$.expr.cacheLength = 1

$.ajaxSetup({
  cache: false,
})
