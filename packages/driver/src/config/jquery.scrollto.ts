/*!
 * jQuery.scrollTo
 * Copyright (c) 2007 Ariel Flesler - aflesler ○ gmail • com | https://github.com/flesler
 * Licensed under MIT
 * https://github.com/flesler/jquery.scrollTo
 * @projectDescription Lightweight, cross-browser and highly customizable animated scrolling with jQuery
 * @author Ariel Flesler
 * @version 2.1.3
 */

/// <reference types="jquery.scrollto" />

/** eslint-disable */
import $ from 'jquery'

export function $scrollTo (target, duration, settings) {
  return $(window).scrollTo(target, duration, settings)
}

$scrollTo.defaults = {
  axis: 'xy',
  duration: 0,
  limit: true,
}

function isWin (elem) {
  return !elem.nodeName ||
    $.inArray(elem.nodeName.toLowerCase(), ['iframe', '#document', 'html', 'body']) !== -1
}

function isFunction (obj) {
  // Brought from jQuery since it's deprecated
  return typeof obj === 'function'
}

export function scrollTo (target, duration, settings) {
  if (typeof duration === 'object') {
    settings = duration
    duration = 0
  }

  if (typeof settings === 'function') {
    settings = { onAfter: settings }
  }

  if (target === 'max') {
    target = 9e9
  }

  settings = $.extend({}, $scrollTo.defaults, settings)
  // Speed is still recognized for backwards compatibility
  duration = duration || settings.duration
  // Make sure the settings are given right
  let queue = settings.queue && settings.axis.length > 1

  if (queue) {
    // Let's keep the overall duration
    duration /= 2
  }

  settings.offset = both(settings.offset)
  settings.over = both(settings.over)

  return this.each(function () {
    // Null target yields nothing, just like jQuery does
    if (target === null) return

    let win = isWin(this)
    let elem = win ? this.contentWindow || window : this
    let $elem = $(elem)
    let targ = target
    let attr = {}
    let toff

    switch (typeof targ) {
      // A number will pass the regex
      case 'number': break
      case 'string':
        if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
          targ = both(targ)
          // We are done
          break
        }

        // Relative/Absolute selector
        targ = win ? $(targ) : $(targ, elem)
        break
        /* falls through */
      case 'object':
        if (targ.length === 0) return

        // DOMElement / jQuery
        if (targ.is || targ.style) {
          // Get the real position of the target
          toff = (targ = $(targ)).offset()
        }

        break

      default:
        break
    }

    let offset = isFunction(settings.offset) && settings.offset(elem, targ) || settings.offset

    $.each(settings.axis.split(''), function (i, axis) {
      let Pos	= axis === 'x' ? 'Left' : 'Top'
      let pos = Pos.toLowerCase()
      let key = `scroll${ Pos}`
      let prev = $elem[key]()
      let max = $scrollTo.max(elem, axis)

      if (toff) { // jQuery / DOMElement
        attr[key] = toff[pos] + (win ? 0 : prev - $elem.offset()![pos])

        // If it's a dom element, reduce the margin
        if (settings.margin) {
          attr[key] -= parseInt(targ.css(`margin${Pos}`), 10) || 0
          attr[key] -= parseInt(targ.css(`border${Pos}Width`), 10) || 0
        }

        attr[key] += offset[pos] || 0

        if (settings.over[pos]) {
          // Scroll to a fraction of its width/height
          attr[key] += targ[axis === 'x' ? 'width' : 'height']() * settings.over[pos]
        }
      } else {
        let val = targ[pos]

        // Handle percentage values
        attr[key] = val.slice && val.slice(-1) === '%' ?
          parseFloat(val) / 100 * max
          : val
      }

      // Number or 'number'
      if (settings.limit && /^\d+$/.test(attr[key])) {
        // Check the limits
        attr[key] = attr[key] <= 0 ? 0 : Math.min(attr[key], max)
      }

      // Don't waste time animating, if there's no need.
      if (!i && settings.axis.length > 1) {
        if (prev === attr[key]) {
          // No animation needed
          attr = {}
        } else if (queue) {
          // Intermediate animation
          animate(settings.onAfterFirst)
          // Don't animate this axis again in the next iteration.
          attr = {}
        }
      }
    })

    animate(settings.onAfter)

    function animate (callback) {
      let opts = $.extend({}, settings, {
        // The queue setting conflicts with animate()
        // Force it to always be true
        queue: true,
        duration,
        complete: callback && function () {
          callback.call(elem, targ, settings)
        },
      })

      $elem.animate(attr, opts)
    }
  })
}

// Max scrolling position, works on quirks mode
// It only fails (not too badly) on IE, quirks mode.
$scrollTo.max = function (elem, axis) {
  let Dim = axis === 'x' ? 'Width' : 'Height'
  let scroll = `scroll${Dim}`

  if (!isWin(elem)) {
    return elem[scroll] - $(elem)[Dim.toLowerCase()]()
  }

  let size = `client${ Dim}`
  let doc = elem.ownerDocument || elem.document
  let html = doc.documentElement
  let body = doc.body

  return Math.max(html[scroll], body[scroll]) - Math.min(html[size], body[size])
}

function both (val) {
  return isFunction(val) || $.isPlainObject(val) ? val : { top: val, left: val }
}

// TODO: find the type of _last in the JQuery code.
interface Tween extends JQuery.Tween<JQuery.Node> {
  _last: any
}

// Add special hooks so that window scroll properties can be animated
$.Tween.propHooks.scrollLeft =
$.Tween.propHooks.scrollTop = {
  get (t) {
    return $(t.elem)[t.prop]()
  },
  set (t: Tween) {
    let curr = this.get(t)

    // If interrupt is true and user scrolled, stop animating
    if (t.options.interrupt && t._last && t._last !== curr) {
      $(t.elem).stop()

      return
    }

    let next = Math.round(t.now)

    // Don't waste CPU
    // Browsers don't render floating point scroll
    if (curr !== next) {
      $(t.elem)[t.prop](next)
      t._last = this.get(t)
    }
  },
}
/** eslint-enable */
