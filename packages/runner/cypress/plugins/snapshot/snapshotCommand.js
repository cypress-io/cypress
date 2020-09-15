const _ = require('lodash')
// if we're in Cypress, we'll need to swap this with Cypress.sinon later
let sinon = require('sinon')
const Debug = require('debug')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const { stripIndent } = require('common-tags')
const { printVar, stringifyShort, isObject, addPluginButton, fmt, typeColors } = require('./snapshotUtils')

const debug = Debug('plugin:snapshot')

/**
 * prints nice assertion error in command log with modified error message
 */
function throwErr (e, message, exp, ctx) {
  try {
    ctx.assert(false, message, 'sdf', exp, e.act, true)
  } catch (err) {
    err.message += `\n\n**- expected  + actual:**\n${e.message}`
    throw err
  }
}

function getMatchDeepMessage (act, exp) {
  return `Expected **${chai.util.objDisplay(act)}** to deep match: **${chai.util.objDisplay(exp)}**`
}

function saveSnapshot (ctx, exactSpecName, file, exp, act) {
  const message = !exp ? 'new snapshot saved' : 'snapshot updated'

  ctx.assert(true, `📸 ${message}: **${exactSpecName}**`, '', exp, act)

  return cy.task('saveSnapshot', {
    file,
    what: act,
    exactSpecName,
  }, { log: false })
}

const registerInCypress = () => {
  // need to use correct sinon version for matcher.isMatcher to work
  sinon = Cypress.sinon
  const $ = Cypress.$

  let snapshotIndex = {}

  chai = window.chai
  chai.Assertion.addMethod('matchDeep', matchDeepCypress)
  chai.Assertion.addMethod('matchSnapshot', matchSnapshotCypress)

  after(() => {
    snapshotIndex = {}
  })

  before(() => {
    addPluginButton($, 'toggle-snapshot-update', '', {
      render () {
        const btnIcon = $(this).children().first()

        return btnIcon.text(top.SNAPSHOT_UPDATE ? 'snapshot\nupdate\non' : 'snapshot\nupdate\noff')
        .css({ 'font-size': '10px', 'line-height': '0.9' })
        .html(btnIcon.html().replace(/\n/g, '<br/>'))
      },
      click () {
        top.SNAPSHOT_UPDATE = !top.SNAPSHOT_UPDATE
      },
    })
  })

  function matchDeepCypress (...args) {
    const exp = args[1] || args[0]
    const ctx = this

    try {
      const res = matchDeep.apply(this, [args[0], args[1], { Cypress, expectedOnly: true }])

      const message = getMatchDeepMessage(res.act, exp)

      ctx.assert(true, message)
      Cypress.log({
        name: 'assert',
        message,
        state: 'passed',
        consoleProps: () => {
          return {
            Actual: res.act,
          }
        },
      })
    } catch (e) {
      throwErr(
        e,
        getMatchDeepMessage(e.act, args[1] || args[0]),
        exp,
        ctx,
      )
    }
  }

  function matchSnapshotCypress (m, snapshotName) {
    const ctx = this
    const file = Cypress.spec.name
    const testName = Cypress.mocha.getRunner().test.fullTitle()

    return cy.then(() => {
      snapshotIndex[testName] = (snapshotIndex[testName] || 1)
      const exactSpecName = snapshotName || `${testName} #${snapshotIndex[testName]}`

      return cy.task('getSnapshot', {
        file,
        exactSpecName,
      }, { log: false })
      .then(function (exp) {
        try {
          snapshotIndex[testName] = snapshotIndex[testName] + 1
          const res = matchDeep.call(ctx, m, exp, { message: 'to match snapshot', Cypress, isSnapshot: true, sinon })

          ctx.assert(true, `snapshot matched: **${exactSpecName}**`, res.act)
        } catch (e) {
          if (!e.known) {
            throw e
          }

          // save snapshot if env var or no previously saved snapshot (and no failed matcher assertions)
          if ((top.SNAPSHOT_UPDATE || !exp) && !e.failedMatcher && e.act) {
            return saveSnapshot(ctx, exactSpecName, file, exp, e.act)
          }

          throwErr(e, `**snapshot failed to match**: ${exactSpecName}`, exp, ctx)
        }
      })
    })
  }
}

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

  const act = this._obj

  m = _.map(m, (val, key) => {
    return [key.split('.'), val]
  })

  const diffStr = withMatchers(m, match, opts.expectedOnly)(exp, act)

  if (diffStr.changed) {
    let e = _.extend(new Error(), { known: true, act: diffStr.act, failedMatcher: diffStr.opts.failedMatcher })

    e.message = isAnsi ? `\n${diffStr.text}` : stripAnsi(diffStr.text)

    if (_.isString(act)) {
      e.message = `\n${stripIndent`
        SnapshotError: Failed to match snapshot
        Expected:\n---\n${printVar(exp)}\n---
        Actual:\n---\n${printVar(diffStr.act)}\n---
        `}`
    }

    throw e
  }

  return diffStr
}

const parseMatcherFromString = (matcher) => {
  const regex = /match\.(.*)/

  if (_.isString(matcher)) {
    const parsed = regex.exec(matcher)

    if (parsed) {
      return parsed[1]
    }
  }
}

function parseMatcherFromObj (obj, match) {
  if (match.isMatcher(obj)) {
    return obj
  }

  const objStr = (_.isString(obj) && obj) || (obj && obj.toJSON && obj.toJSON())

  if (objStr) {
    const parsed = parseMatcherFromString(objStr)

    if (parsed) {
      return match[parsed]
    }
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

      if (matched) {
        return rep[1]
      }
    }

    return NO_REPLACEMENT
  }

  const testValue = (matcher, value) => {
    if (matcher.test(value)) {
      return true
    }

    return false
  }

  const NO_REPLACEMENT = {}

  /**
   * diffing function that produces human-readable diff output.
   * unfortunately it is also unreadable code in itself.
   */
  const diff = (exp, act, path = ['^'], optsArg) => {
    const opts = _.defaults({}, optsArg, {
      expectedOnly,
    })

    if (path.length > 15) {
      throw new Error(`exceeded max depth on ${path.slice(0, 4)} ... ${path.slice(-4)}`)
    }

    let text = ''
    let changed = false
    let itemDiff
    let keys
    let subOutput = ''

    let replacement = getReplacementFor(path, matchers)

    if (replacement !== NO_REPLACEMENT) {
      if (match.isMatcher(replacement)) {
        if (testValue(replacement, act)) {
          act = matcherStringToObj(replacement.message).toJSON()
        } else {
          opts.failedMatcher = true
          if (!_.isFunction(act)) {
            act = _.clone(act)
          }

          exp = replacement
        }
      } else {
        act = setReplacement(act, replacement, path)
      }
    } else {
      if (!_.isFunction(act) && !_.isFunction(_.get(act, 'toJSON'))) {
        act = _.clone(act)
      }

      exp = parseMatcherFromObj(exp, match)
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
          text: fmt.wrap('failed', `${chalk.green(printVar(act))} ⛔  ${matcherStringToObj(exp.message).toJSON()}`),
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

      if (_.isArray(exp)) {
        keys.sort((a, b) => +a - +b)
      } else {
        keys.sort()
      }

      for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        const isUndef = exp[key] === undefined

        if (_.hasIn(act, key) || isUndef) {
          itemDiff = diff(exp[key], act[key], path.concat([key]))
          _.defaults(opts, itemDiff.opts)
          act[key] = itemDiff.act
          if (itemDiff.changed) {
            subOutput += fmt.keyChanged(key, itemDiff.text)
            changed = true
          }
        } else {
          subOutput += fmt.keyRemoved(key, exp[key])
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

          _.defaults(opts, addDiff.opts)

          act[key] = addDiff.act
          if (act[key] === undefined) continue

          if (opts.failedMatcher) {
            subOutput += addDiff.text
          } else {
            subOutput += fmt.keyAdded(key, act[key])
          }

          changed = true
        }
      }

      if (changed) {
        text = fmt.wrapObjectLike(exp, act, subOutput)
      }
    } else if (match.isMatcher(exp)) {
      debug('is matcher')
      if (!testValue(exp, act)) {
        text = fmt.wrap('failed', `${chalk.green(printVar(act))} ⛔  ${matcherStringToObj(exp.message).toJSON()}`)
        changed = true
      }
    } else if (isObject(act)) {
      debug('only act is obj')

      const addDiff = diff({}, act, path, { expectedOnly: false })

      _.defaults(opts, addDiff.opts)

      return _.extend({},
        addDiff, {
          changed: true,
          text: fmt.wrap('removed', `${printVar(exp)}\n${fmt.wrap('added', addDiff.text)}`),
        })
    } else {
      debug('neither is obj')
      exp = printVar(exp)
      act = printVar(act)

      if (exp !== act) {
        text = fmt.wrap('modified', `${exp} ${typeColors['normal']('⮕')} ${act}`)
        changed = true
      }
    }

    return {
      changed,
      text,
      act,
      opts,
    }
  }

  return diff
}

module.exports = {
  registerInCypress,
  matchDeep,
  stringifyShort,
  parseMatcherFromString,
}
