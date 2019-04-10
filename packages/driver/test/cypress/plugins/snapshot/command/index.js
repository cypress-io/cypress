let _ = require('lodash')
const Debug = require('debug')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')

let sinon = require('sinon')

const debug = Debug('plugin:snapshot')

// window.localStorage.debug = 'spec* plugin:snapshot'
// Debug.enable('plugin:snapshot')

const registerInCypress = () => {
  _ = Cypress._
  sinon = Cypress.sinon
  const $ = Cypress.$

  let snapshotIndex = {}

  const matchDeepCypress = function (...args) {
    matchDeep.apply(this, [...args, { Cypress }])
  }

  const matchSnapshotCypress = function (m, snapshotName) {
    const ctx = this
    const testName = Cypress.mocha.getRunner().test.fullTitle()
    const file = Cypress.spec.name

    snapshotIndex[testName] = (snapshotIndex[testName] || 0) + 1
    const exactSpecName = snapshotName || `${testName} #${snapshotIndex[testName]}`

    cy.task('getSnapshot', {
      file,
      exactSpecName,
    }, { log: false }).then((exp) => {
      try {
        const res = matchDeep.call(ctx, m, exp, { message: 'to match snapshot', Cypress, isSnapshot: true, sinon })

        Cypress.log({
          name: 'assert',
          message: `snapshot matched: **${exactSpecName}**`,
          state: 'passed',
          consoleProps: () => {
            return {
              Actual: res.act,
            }
          },
        })
      } catch (e) {
        if (Cypress.env('SNAPSHOT_UPDATE') && e.act) {
          Cypress.log({
            name: 'assert',
            message: `snapshot updated: **${exactSpecName}**`,
            state: 'passed',
            consoleProps: () => {
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
          consoleProps: () => {
            return {
              Expected: exp,
              Actual: e.act,
            }
          },
        })

        throw e
      }

    })
    .then((act) => {
      cy.task('saveSnapshot', {
        file,
        what: act,
        exactSpecName,
      }, { log: false })

    })
  }

  chai.Assertion.addMethod('matchDeep', matchDeepCypress)
  chai.Assertion.addMethod('matchSnapshot', matchSnapshotCypress)

  after(() => {
    snapshotIndex = {}
  })

  before(() => {

    const btn = addButton('toggle-snapshot-update', '', () => {
      const prev = Cypress.env('SNAPSHOT_UPDATE')

      Cypress.env('SNAPSHOT_UPDATE', !prev)
      updateText()
    })
    const btnIcon = btn.children().first()
    const updateText = () => {
      return btnIcon.text(Cypress.env('SNAPSHOT_UPDATE') ? 'snapshot\nupdate\non' : 'snapshot\nupdate\noff')
      .css({ 'font-size': '10px', 'line-height': '0.9' })
      .html(btnIcon.html().replace(/\n/g, '<br/>'))
    }

    updateText()
  })

  const addButton = (name, faClass, fn) => {
    $(`#${name}`, window.top.document).remove()

    const btn = $(`<span id="${name}"><button><i class="fa ${faClass}"></i></button></span>`, window.top.document)
    const container = $(
      '.toggle-auto-scrolling.auto-scrolling-enabled',
      window.top.document
    ).closest('.controls')

    container.prepend(btn)

    btn.on('click', fn)

    return btn
  }

}

// // unfortunate, but sinon uses isPrototype of, which will not work for
// // two different sinon versions
// match.isMatcher = (obj) => {
//   return _.isFunction(_.get(obj, 'test')) &&
//   _.isString(_.get(obj, 'message')) &&
//   _.isFunction(_.get(obj, 'and')) &&
//   _.isFunction(_.get(obj, 'or'))
// }

const matcherStringToObj = (mes) => {
  const res = mes.replace(/typeOf\("(\w+)"\)/, '$1')

  const ret = {}

  ret.toString = () => {
    return `${res}`
  }

  ret.toJSON = () => {
    return `match.${res}`
  }

  return ret
}

const matchDeep = function (matchers, exp, optsArg) {
  let m = matchers

  if (exp === undefined) {
    exp = m
    m = {}
  }

  // debug(optsArg)

  const opts = _.defaults(optsArg, {
    message: 'to match',
    Cypress: false,
    diff: true,
    expectedOnly: false,
    sinon: null,
  })

  if (!opts.sinon) {
    opts.sinon = sinon
  }

  const match = opts.sinon.match
  const isAnsi = !opts.Cypress
  // const isSnapshot = opts.isSnapshot

  const act = this._obj

  // let act = this._obj
  // console.log(act)

  m = _.map(m, (val, key) => {
    return [key.split('.'), val]
  })

  const diffStr = withMatchers(m, match, opts.expectedOnly)(exp, act)

  // console.log(diffStr.act)
  if (diffStr.changed) {

    let e = _.extend(new Error(), { act: diffStr.act })

    // e.act[1][1].somefoo = undefined
    e.message = isAnsi ? `\n${diffStr.text}` : stripAnsi(diffStr.text)
    throw e
  }

  return diffStr

}

module.exports = {
  registerInCypress,
  matchDeep,

}

let typeColors = {
  modified: chalk.yellow,
  added: chalk.green,
  removed: chalk.red,
  normal: chalk.gray,
  failed: chalk.redBright,
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
    const parsed = /match\.(.*)/.exec(parseObj)

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

const withMatchers = (matchers, match, expectedOnly = false) => {

  const getReplacementFor = (path = [], m) => {

    for (let rep of m) {

      const wildCards = _.keys(_.pickBy(rep[0], (value) => {
        return value === '*'
      }))

      const _path = _.map(path, (value, key) => {
        if (_.includes(wildCards, `${key}`)) {
          return '*'
        }

        return value
      })

      const matched = _path.join('.').endsWith(rep[0].join('.'))

      // (_.last(_path) === _.last(val[0]))
      //    && _.isEqual(_.intersection(_path, val[0]), val[0])

      if (matched) {
        return rep[1]
      }

    }

    return no_replacement
  }

  const testValue = (matcher, value) => {

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

  const no_replacement = {}

  const diff = (exp, act, path = ['^'], optsArg) => {
    const opts = _.defaults(optsArg, {
      expectedOnly,
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
          text: options.wrap('failed', `${chalk.green(printVar(act))} ⛔  ${matcherStringToObj(exp.message).toJSON()}`),
          changed: true,
          act,
        }
      }
    }

    if (_.isFunction(_.get(act, 'toJSON'))) {
      act = act.toJSON()
    }

    if (isObject(exp) && isObject(act) && !match.isMatcher(exp)) {
      keys = _.keysIn(exp)
      let actObj = _.extend({}, act)
      let key

      keys.sort()
      for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        const isUndef = exp[key] === undefined

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

      if (!opts.expectedOnly) {

        for (let i = 0; i < addedKeys.length; i++) {
          const key = addedKeys[i]
          const val = act[key]

          const addDiff = diff(val, val, path.concat([key]))

          act[key] = addDiff.act
          if (act[key] === undefined) continue

          subOutput += keyAdded(key, act[key])
          changed = true
        }
      }

      if (changed) {
        let renderBracket = false

        if (_.isArray(act) && _.isArray(exp)) {
          renderBracket = true
        }

        const _O = renderBracket ? '[' : '{'
        const _C = renderBracket ? ']' : '}'

        text = options.wrap('normal', `${_O}${options.newLineChar}${subOutput}${_C}`)
      }

    // }
      // else if (Array.isArray(act)) {
      //   return diff([], act, path)
    } else if (match.isMatcher(exp)) {
      debug('is matcher')
      if (!testValue(exp, act)) {
        text = options.wrap('failed', `${chalk.green(printVar(act))} ⛔  ${matcherStringToObj(exp.message).toJSON()}`)
        changed = true
      }
    } else if (isObject(act)) {
      debug('only act is obj')
      const addDiff = diff({}, act, path, { expectedOnly: false })

      return _.extend({},
        addDiff, {
          changed: true,
          text: options.wrap('removed', `${printVar(exp)}\n${options.wrap('added', addDiff.text)}`),
        })

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
        text = options.wrap('modified', `${exp} ➡️  ${act}`)
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

const stringifyShort = (obj) => {
  const constructorName = _.get(obj, 'constructor.name')

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
