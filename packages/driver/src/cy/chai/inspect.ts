// Changes made: added 'formatValueHook' to process value before being formatted.
// For example the hook can be used to turn `window` objects into the string '[window]'
// to avoid deep recursion.

// This is (almost) directly from chai/lib/util (which is based on nodejs utils)
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

// let getName = require('get-func-name')
// let getProperties = require('./getProperties')
import getEnumerableProperties from 'chai/lib/chai/utils/getEnumerableProperties'
// let config = require('../config')

export function create (chai) {
  const { getName, getProperties } = chai.util
  const { config } = chai

  /**
   * ### .inspect(obj, [showHidden], [depth], [colors])
   *
   * Echoes the value of a value. Tries to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
   *    properties of objects. Default is false.
   * @param {Number} depth Depth in which to descend in object. Default is 2.
   * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
   *    output. Default is false (no coloring).
   * @namespace Utils
   * @name inspect
   */
  function inspect (obj, showHidden, depth, colors) {
    let ctx = {
      showHidden,
      seen: [],
      stylize (str) {
        return str
      },
    }

    return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth))
  }

  // Returns true if object is a DOM element.
  let isDOMElement = function (object) {
    if (typeof HTMLElement === 'object') {
      return object instanceof HTMLElement
    }

    return object &&
      typeof object === 'object' &&
      'nodeType' in object &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string'
  }

  // We can't just check if object instanceof ShadowRoot, because it might be the document of an iframe,
  // which in Chrome 99+ is a separate class, and instanceof ShadowRoot returns false.
  const isShadowRoot = function (object) {
    return isDOMElement(object.host) && object.host.shadowRoot === object
  }

  // We can't just check if object instanceof Document, because it might be the document of an iframe,
  // which in Chrome 99+ is a separate class, and instanceof Document returns false.
  const isDocument = function (object) {
    return object.defaultView && object.defaultView === object.defaultView.window
  }

  let formatValueHook

  const setFormatValueHook = (fn) => formatValueHook = fn

  function formatValue (ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it

    const hookRet = formatValueHook && formatValueHook(ctx, value)

    if (hookRet) {
      return hookRet
    }

    if (value && typeof value.inspect === 'function' &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
      let ret = value.inspect(recurseTimes, ctx)

      if (typeof ret !== 'string') {
        ret = formatValue(ctx, ret, recurseTimes)
      }

      return ret
    }

    // Primitive types cannot have properties
    let primitive = formatPrimitive(ctx, value)

    if (primitive) {
      return primitive
    }

    // If this is a DOM element, try to get the outer HTML.
    if (isDOMElement(value)) {
      if ('outerHTML' in value) {
        return value.outerHTML
        // This value does not have an outerHTML attribute,
        //   it could still be an XML element
      }

      // Attempt to serialize it
      try {
        // @ts-ignore
        if (document.xmlVersion) {
          let xmlSerializer = new XMLSerializer()

          return xmlSerializer.serializeToString(value)
        }

        // Firefox 11- do not support outerHTML
        //   It does, however, support innerHTML
        //   Use the following to render the element
        let ns = 'http://www.w3.org/1999/xhtml'
        let container = document.createElementNS(ns, '_')

        container.appendChild(value.cloneNode(false))
        let html = container.innerHTML
        .replace('><', `>${value.innerHTML}<`)

        container.innerHTML = ''

        return html
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }

    if (isShadowRoot(value)) {
      return value.innerHTML
    }

    if (isDocument(value)) {
      return value.documentElement.outerHTML
    }

    // Look up the keys of the object.
    let visibleKeys = getEnumerableProperties(value)
    let keys = ctx.showHidden ? getProperties(value) : visibleKeys

    let name; let nameSuffix

    // Some type of object without properties can be shortcut.
    // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
    // a `stack` plus `description` property; ignore those for consistency.
    if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
    ))) {
      if (typeof value === 'function') {
        name = getName(value)
        nameSuffix = name ? `: ${name}` : ''

        return ctx.stylize(`[Function${nameSuffix}]`, 'special')
      }

      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp')
      }

      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toUTCString.call(value), 'date')
      }

      if (isError(value)) {
        return formatError(value)
      }
    }

    let base = ''
    let array = false
    let typedArray = false
    let braces = ['{', '}']

    if (isTypedArray(value)) {
      typedArray = true
      braces = ['[', ']']
    }

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true
      braces = ['[', ']']
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      name = getName(value)
      nameSuffix = name ? `: ${name}` : ''
      base = ` [Function${nameSuffix}]`
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ` ${RegExp.prototype.toString.call(value)}`
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ` ${Date.prototype.toUTCString.call(value)}`
    }

    // Make error with message first say the error
    if (isError(value)) {
      return formatError(value)
    }

    // eslint-disable-next-line eqeqeq
    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1]
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp')
      }

      return ctx.stylize('[Object]', 'special')
    }

    ctx.seen.push(value)

    let output

    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys)
    } else if (typedArray) {
      return formatTypedArray(value)
    } else {
      output = keys.map(function (key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array)
      })
    }

    ctx.seen.pop()

    return reduceToSingleString(output, base, braces)
  }

  function formatPrimitive (ctx, value) {
    switch (typeof value) {
      case 'undefined':
        return ctx.stylize('undefined', 'undefined')

      case 'string': {
        const simple = `'${JSON.stringify(value).replace(/^"|"$/g, '')
        .replace(/'/g, '\\\'')
        .replace(/\\"/g, '"')}'`

        return ctx.stylize(simple, 'string')
      }

      case 'number':
        if (value === 0 && (1 / value) === -Infinity) {
          return ctx.stylize('-0', 'number')
        }

        return ctx.stylize(`${value}`, 'number')

      case 'boolean':
        return ctx.stylize(`${value}`, 'boolean')

      case 'symbol':
        return ctx.stylize(value.toString(), 'symbol')

      case 'bigint':
        return ctx.stylize(`${value.toString()}n`, 'bigint')

      default:
        null
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return ctx.stylize('null', 'null')
    }
  }

  function formatError (value) {
    return `[${Error.prototype.toString.call(value)}]`
  }

  function formatArray (ctx, value, recurseTimes, visibleKeys, keys) {
    let output: string[] = []

    for (let i = 0, l = value.length; i < l; ++i) {
      if (Object.prototype.hasOwnProperty.call(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true))
      } else {
        output.push('')
      }
    }

    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true))
      }
    })

    return output
  }

  function formatTypedArray (value) {
    let str = '[ '

    for (let i = 0; i < value.length; ++i) {
      if (str.length >= config.truncateThreshold - 7) {
        str += '...'
        break
      }

      str += `${value[i]}, `
    }
    str += ' ]'

    // Removing trailing `, ` if the array was not truncated
    if (str.indexOf(',  ]') !== -1) {
      str = str.replace(',  ]', ' ]')
    }

    return str
  }

  function formatProperty (ctx, value, recurseTimes, visibleKeys, key, array) {
    let name
    let propDescriptor = Object.getOwnPropertyDescriptor(value, key)
    let str

    if (propDescriptor) {
      if (propDescriptor.get) {
        if (propDescriptor.set) {
          str = ctx.stylize('[Getter/Setter]', 'special')
        } else {
          str = ctx.stylize('[Getter]', 'special')
        }
      } else {
        if (propDescriptor.set) {
          str = ctx.stylize('[Setter]', 'special')
        }
      }
    }

    if (visibleKeys.indexOf(key) < 0) {
      name = `[${key}]`
    }

    if (!str) {
      if (ctx.seen.indexOf(value[key]) < 0) {
        if (recurseTimes === null) {
          str = formatValue(ctx, value[key], null)
        } else {
          str = formatValue(ctx, value[key], recurseTimes - 1)
        }

        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function (line) {
              return `  ${line}`
            }).join('\n').substr(2)
          } else {
            str = `\n${str.split('\n').map(function (line) {
              return `   ${line}`
            }).join('\n')}`
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special')
      }
    }

    if (typeof name === 'undefined') {
      if (array && key.match(/^\d+$/)) {
        return str
      }

      name = JSON.stringify(`${key}`)
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2)
        name = ctx.stylize(name, 'name')
      } else {
        name = name.replace(/'/g, '\\\'')
        .replace(/\\"/g, '"')
        .replace(/(^"|"$)/g, '\'')

        name = ctx.stylize(name, 'string')
      }
    }

    return `${name}: ${str}`
  }

  function reduceToSingleString (output, base, braces) {
    let length = output.reduce(function (prev, cur) {
      return prev + cur.length + 1
    }, 0)

    if (length > 60) {
      return `${braces[0] +
        (base === '' ? '' : `${base}\n `)
        } ${output.join(',\n  ')
        } ${braces[1]}`
    }

    return `${braces[0] + base} ${output.join(', ')} ${braces[1]}`
  }

  function isTypedArray (ar) {
    // Unfortunately there's no way to check if an object is a TypedArray
    // We have to check if it's one of these types
    return (typeof ar === 'object' && /\w+Array]$/.test(objectToString(ar)))
  }

  function isArray (ar) {
    return Array.isArray(ar) ||
      (typeof ar === 'object' && objectToString(ar) === '[object Array]')
  }

  function isRegExp (re) {
    return typeof re === 'object' && objectToString(re) === '[object RegExp]'
  }

  function isDate (d) {
    return typeof d === 'object' && objectToString(d) === '[object Date]'
  }

  function isError (e) {
    return typeof e === 'object' && objectToString(e) === '[object Error]'
  }

  function objectToString (o) {
    return Object.prototype.toString.call(o)
  }

  return {
    inspect,
    setFormatValueHook,
  }
}
