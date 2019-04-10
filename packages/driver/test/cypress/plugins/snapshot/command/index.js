'use strict'
var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i]
      for (let p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) {
          t[p] = s[p]
        }
      }
    }

    return t
  }

  return __assign.apply(this, arguments)
}

exports.__esModule = true

// @ts-ignore
let _ = require('lodash')
// @ts-ignore
let debug_1 = require('debug')
let chalk_1 = require('chalk')
let stripAnsi = require('strip-ansi')
let sinon_1 = require('sinon')
let debug = debug_1['default']('plugin:snapshot')
// window.localStorage.debug = 'spec* plugin:snapshot'
// Debug.enable('plugin:snapshot')
let registerInCypress = function () {
  //@ts-ignore
  _ = Cypress._
  //@ts-ignore
  sinon_1['default'] = Cypress.sinon
  let $ = Cypress.$
  let snapshotIndex = {}
  let matchDeepCypress = function () {
    let args = []

    for (let _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i]
    }
    matchDeep.apply(this, args.concat([{ Cypress }]))
  }
  let matchSnapshotCypress = function (m, snapshotName) {
    let ctx = this
    let testName = Cypress.mocha.getRunner().test.fullTitle()
    let file = Cypress.spec.name

    snapshotIndex[testName] = (snapshotIndex[testName] || 0) + 1
    let exactSpecName = snapshotName || `${testName} #${snapshotIndex[testName]}`

    cy.task('getSnapshot', {
      file,
      exactSpecName,
    }, { log: false }).then(function (exp) {
      try {
        let res_1 = matchDeep.call(ctx, m, exp, { message: 'to match snapshot', Cypress, isSnapshot: true, sinon: sinon_1['default'] })

        Cypress.log({
          name: 'assert',
          message: `snapshot matched: **${exactSpecName}**`,
          state: 'passed',
          consoleProps () {
            return {
              Actual: res_1.act,
            }
          },
        })
      } catch (e) {
        if (Cypress.env('SNAPSHOT_UPDATE') && e.act) {
          Cypress.log({
            name: 'assert',
            message: `snapshot updated: **${exactSpecName}**`,
            state: 'passed',
            consoleProps () {
              return {
                Expected: exp,
                Actual: e.act,
              }
            },
          })

          return e.act
        }

        Cypress.log({
          name: 'assert',
          message: `**snapshot failed match**: ${e.message}`,
          state: 'failed',
          consoleProps () {
            return {
              Expected: exp,
              Actual: e.act,
            }
          },
        })
        throw e
      }
    })
    .then(function (act) {
      cy.task('saveSnapshot', {
        file,
        what: act,
        exactSpecName,
      }, { log: false })
    })
  }

  chai.Assertion.addMethod('matchDeep', matchDeepCypress)
  chai.Assertion.addMethod('matchSnapshot', matchSnapshotCypress)
  after(function () {
    snapshotIndex = {}
  })
  before(function () {
    let btn = addButton('toggle-snapshot-update', '', function () {
      let prev = Cypress.env('SNAPSHOT_UPDATE')

      Cypress.env('SNAPSHOT_UPDATE', !prev)
      updateText()
    })
    let btnIcon = btn.children().first()
    var updateText = function () {
      return btnIcon.text(Cypress.env('SNAPSHOT_UPDATE') ? 'snapshot\nupdate\non' : 'snapshot\nupdate\noff')
      .css({ 'font-size': '10px', 'line-height': '0.9' })
      .html(btnIcon.html().replace(/\n/g, '<br/>'))
    }

    updateText()
  })
  var addButton = function (name, faClass, fn) {
    $(`#${name}`, window.top.document).remove()
    let btn = $(`<span id="${name}"><button><i class="fa ${faClass}"></i></button></span>`, window.top.document)
    let container = $('.toggle-auto-scrolling.auto-scrolling-enabled', window.top.document).closest('.controls')

    container.prepend(btn)
    btn.on('click', fn)

    return btn
  }
}

exports.registerInCypress = registerInCypress

// // unfortunate, but sinon uses isPrototype of, which will not work for
// // two different sinon versions
// match.isMatcher = (obj) => {
//   return _.isFunction(_.get(obj, 'test')) &&
//   _.isString(_.get(obj, 'message')) &&
//   _.isFunction(_.get(obj, 'and')) &&
//   _.isFunction(_.get(obj, 'or'))
// }
let matcherStringToObj = function (mes) {
  let res = mes.replace(/typeOf\("(\w+)"\)/, '$1')
  let ret = {}

  ret.toString = function () {
    return `${res}`
  }
  ret.toJSON = function () {
    return `match.${res}`
  }

  return ret
}
var matchDeep = function (matchers, exp, optsArg) {
  let m = matchers

  if (exp === undefined) {
    exp = m
    m = {}
  }

  // debug(optsArg)
  let opts = _.defaults(optsArg, {
    message: 'to match',
    Cypress: false,
    diff: true,
    onlyExpected: false,
    sinon: null,
  })

  if (!opts.sinon) {
    opts.sinon = sinon_1['default']
  }

  let match = opts.sinon.match
  let isAnsi = !opts.Cypress
  // const isSnapshot = opts.isSnapshot
  let act = this._obj

  // let act = this._obj
  // console.log(act)
  m = _.map(m, function (val, key) {
    return [key.split('.'), val]
  })
  let diffStr = withMatchers(m, match, opts.onlyExpected)(exp, act)

  // console.log(diffStr.act)
  if (diffStr.changed) {
    let e = _.extend(new Error(), { act: diffStr.act })

    // e.act[1][1].somefoo = undefined
    e.message = isAnsi ? `\n${diffStr.text}` : stripAnsi(diffStr.text)
    throw e
  }

  return diffStr
}

exports.matchDeep = matchDeep

let typeColors = {
  modified: chalk_1['default'].yellow,
  added: chalk_1['default'].green,
  removed: chalk_1['default'].red,
  normal: chalk_1['default'].gray,
  failed: chalk_1['default'].redBright,
}
let options = {
  indent: 2,
  indentChar: ' ',
  newLineChar: '\n',
  wrap: function wrap (type, text) {
    return typeColors[type](text)
  },
}
let indent = ''

for (let i = 0; i < options.indent; i++) {
  indent += options.indentChar
}
function isObject (obj) {
  return typeof obj === 'object' && obj && getType(obj) !== 'RegExp'
  // return typeof obj === 'object' && obj && !Array.isArray(obj)
}
function printVar (variable) {
  switch (getType(variable)) {
    case 'Null':
      return variable
    case 'Undefined':
      return variable
    case 'Boolean':
      return variable
    case 'Number':
      return variable
    case 'Function':
      return `[Function${variable.name ? ` ${variable.name}` : ''}]`
      // return variable.toString().replace(/\{.+\}/, '{}')
    case 'Array':
    case 'Object':
      if (variable.toJSON) {
        return variable.toJSON()
      }

      return stringifyShort(variable)

      return `[${getType(variable)}]`
    case 'String':
      return `${variable}`
      // return JSON.stringify(variable)
    default: return `${variable}`
  }
}
function indentSubItem (text) {
  return text.split(options.newLineChar).map(function onMap (line, index) {
    if (index === 0) {
      return line
    }

    return indent + line
  }).join(options.newLineChar)
}
function getType (obj) {
  return Object.prototype.toString.call(obj).split('[object ').join('').slice(0, -1)
}
function keyChanged (key, text) {
  return `${indent + key}: ${indentSubItem(text)}${options.newLineChar}`
}
function keyRemoved (key, variable) {
  return options.wrap('removed', `- ${key}: ${printVar(variable)}`) + options.newLineChar
}
function keyAdded (key, variable) {
  return options.wrap('added', `+ ${key}: ${printVar(variable)}`) + options.newLineChar
}
function parseMatcher (obj, match) {
  if (match.isMatcher(obj)) {
    return obj
  }

  let parseObj = (_.isString(obj) && obj) || (obj && obj.toJSON && obj.toJSON())

  if (parseObj) {
    let parsed = /match\.(.*)/.exec(parseObj)

    if (parsed) {
      // debug('parsed matcher from string:', parsed[1])
      return match[parsed[1]]
    }

    return obj
  }

  return obj
}
function setReplacement (act, val, path) {
  if (_.isFunction(val)) {
    return val(act, path)
  }

  return val
}
var withMatchers = function (matchers, match, onlyExpected) {
  let getReplacementFor = function (path, m) {
    if (path === void 0) {
      path = []
    }

    let _loop_1 = function (rep) {
      let wildCards = _.keys(_.pickBy(rep[0], function (value) {
        return value === '*'
      }))
      let _path = _.map(path, function (value, key) {
        if (_.includes(wildCards, `${key}`)) {
          return '*'
        }

        return value
      })
      let matched = _path.join('.').endsWith(rep[0].join('.'))

      // (_.last(_path) === _.last(val[0]))
      //    && _.isEqual(_.intersection(_path, val[0]), val[0])
      if (matched) {
        return { value: rep[1] }
      }
    }

    for (let _i = 0, m_1 = m; _i < m_1.length; _i++) {
      let rep = m_1[_i]
      let state_1 = _loop_1(rep)

      if (typeof state_1 === 'object') {
        return state_1.value
      }
    }

    return no_replacement
  }
  let testValue = function (matcher, value) {
    // if (match.isMatcher(value)) {
    //   if (value.toString() === matcher.toString()) {
    //     return true
    //   }
    // }
    if (matcher.test(value)) {
      return true
    }

    // addErr(new Error(`replace matcher failed: ${genError(newPath, matcher.toString(), value)}`))
    return false
  }
  var no_replacement = {}
  var diff = function (exp, act, path, optsArg) {
    if (path === void 0) {
      path = ['^']
    }

    let opts = _.defaults(optsArg, {
      onlyExpected,
    })

    if (path.length > 15) {
      throw new Error(`exceeded max depth on ${path.slice(-8)}`)
    }

    // console.log(act)
    let text = ''
    let changed = false
    let itemDiff
    let keys
    let subOutput = ''
    let replacement = getReplacementFor(path, matchers)

    // console.log(path)
    if (replacement !== no_replacement) {
      if (match.isMatcher(replacement)) {
        if (testValue(replacement, act)) {
          act = matcherStringToObj(replacement.message).toJSON()
        } else {
          // changed = true
          if (!_.isFunction(act)) {
            act = _.clone(act)
          }

          exp = matcherStringToObj(replacement.message).toJSON()
        }
      } else {
        act = setReplacement(act, replacement, path)
      }
    } else {
      if (!_.isFunction(act) && !_.isFunction(_.get(act, 'toJSON'))) {
        act = _.clone(act)
      }

      exp = parseMatcher(exp, match)
      if (match.isMatcher(exp)) {
        if (testValue(exp, act)) {
          act = matcherStringToObj(exp.message).toJSON()

          return {
            text: '',
            changed: false,
            act,
          }
        }

        return {
          text: options.wrap('failed', `${chalk_1['default'].green(printVar(act))} \u26D4  ${matcherStringToObj(exp.message).toJSON()}`),
          changed: true,
          act,
        }
        // changed = true
        exp = matcherStringToObj(exp.message).toJSON()

      }
    }

    if (_.isFunction(_.get(act, 'toJSON'))) {
      act = act.toJSON()
    }

    if (isObject(exp) && isObject(act) && !match.isMatcher(exp)) {
      keys = _.keysIn(exp)
      let actObj = __assign({}, act)
      let key = void 0

      keys.sort()
      for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        let isUndef = exp[key] === undefined

        if (_.hasIn(act, key) || isUndef) {
          itemDiff = diff(exp[key], act[key], path.concat([key]))
          act[key] = itemDiff.act
          if (itemDiff.changed) {
            subOutput += keyChanged(key, itemDiff.text)
            changed = true
          }
        } else {
          subOutput += keyRemoved(key, exp[key])
          changed = true
        }

        delete actObj[key]
      }
      let addedKeys = _.keysIn(actObj)

      if (!opts.onlyExpected) {
        for (var i = 0; i < addedKeys.length; i++) {
          let key_1 = addedKeys[i]
          let val = act[key_1]
          var addDiff = diff(val, val, path.concat([key_1]))

          act[key_1] = addDiff.act
          if (act[key_1] === undefined) {
            continue
          }

          subOutput += keyAdded(key_1, act[key_1])
          changed = true
        }
      }

      if (changed) {
        let renderBracket = false

        if (_.isArray(act) && _.isArray(exp)) {
          renderBracket = true
        }

        let _O = renderBracket ? '[' : '{'
        let _C = renderBracket ? ']' : '}'

        text = options.wrap('normal', `${_O}${options.newLineChar}${subOutput}${_C}`)
      }
      // }
      // else if (Array.isArray(act)) {
      //   return diff([], act, path)
    } else if (match.isMatcher(exp)) {
      debug('is matcher')
      if (!testValue(exp, act)) {
        text = options.wrap('failed', `${chalk_1['default'].green(printVar(act))} \u26D4  ${matcherStringToObj(exp.message).toJSON()}`)
        changed = true
      }
    } else if (isObject(act)) {
      debug('only act is obj')
      var addDiff = diff({}, act, path, { onlyExpected: false })

      return __assign({}, addDiff, { changed: true, text: options.wrap('removed', `${printVar(exp)}\n${options.wrap('added', addDiff.text)}`) })
      // return {
      //   changed: true,
      //   text: options.wrap('modified', `${exp} => ${act}`),
      //   act: addDiff.act
      // }
    } else {
      debug('neither is obj')
      exp = printVar(exp)
      act = printVar(act)
      if (exp !== act) {
        text = options.wrap('modified', `${exp} \u27A1\uFE0F  ${act}`)
        changed = true
      }
    }

    return {
      changed,
      text,
      act,
    }
  }

  return diff
}
// module.exports = diff
var stringifyShort = function (obj) {
  let constructorName = _.get(obj, 'constructor.name')

  if (constructorName && !_.includes(['Object', 'Array'], constructorName)) {
    return `{${constructorName}}`
  }

  if (_.isArray(obj)) {
    return `[Array ${obj.length}]`
  }

  if (_.isObject(obj)) {
    return `{Object ${Object.keys(obj).length}}`
  }

  return obj
}
