/* eslint-disable no-console */

import _ from 'lodash'

const _joinLogArgs = (args1, args2) => {

  if (!_.isArray(args1)) {
    return _joinLogArgs(_logCSS(args1, ''), args2)
  }

  if (!_.isArray(args2)) {
    return _joinLogArgs(args1, _logCSS(args2, ''))
  }

  const ret1 = `${args1[0]} ${args2[0]}`
  const ret2 = args1.slice(1).concat(args2.slice(1))

  const toRet = [ret1].concat(ret2)

  return toRet
}

// Fixes cases when string to style includes an escape character
const _escapeConsoleString = (line) => {

  // spacial sequences include '%c', '%f', '%d', etc
  // can be escaped by doubling the amount of "%"
  return line.replace(/(%+)(c|f|o|O|d|i|s)/g, '$1$1$2')

}

const _logColor = (line, color) => {
  return _logCSS(line, `color:${color}`)
}

const _logCSS = (line, css) => {
  return [`%c${_escapeConsoleString(line)}`, css]
}

const _formatDiffHeader = () => {
  return ['Diff: ', _logColor('+ expected', 'green'), _logColor('- actual', 'red')].reduce(_joinLogArgs)
}

// this is tested in driver/assertions_spec
const _formatConsoleDiff = (diff) => {
  let indent = '\n   '

  function cleanUp (line) {
    if (line[0] === '+') {
      return _logColor(`${indent + line}`, 'green')
    }

    if (line[0] === '-') {
      return _logColor(`${indent + line}`, 'red')
    }

    if (line.match(/@@/)) {
      return _logCSS('\n ...', 'font-weight:bold')
    }

    if (line.match(/\\ No newline/)) {
      return '\n'
    }

    return indent + line
  }
  function notBlank (line) {
    return typeof line !== 'undefined' && line !== '\n'
  }

  let lines = diff.split('\n').splice(5)

  return (
    [].concat(
      lines
      .map(cleanUp)
      .filter(notBlank)
    )
    .reduce((diffA, diffB) => {
      return _joinLogArgs(diffA, diffB)
    }, [''])
  )
}

export default {
  log (...args) {
    console.log(...args)
  },

  logError (...args) {
    console.error(...args)
  },

  clearLog () {
    if (console.clear) console.clear()
  },

  logFormatted (consoleProps) {
    if (_.isEmpty(consoleProps)) return

    this._logValues(consoleProps)
    this._logGroups(consoleProps)
    this._logTable(consoleProps)
  },

  collapsedLog (headerArgs, logArgs) {
    console.groupCollapsed(...headerArgs)
    this.log(...logArgs)
    console.groupEnd()
  },

  _logValues (consoleProps) {
    const formattedLog = this._formatted(_.omit(consoleProps, 'groups', 'table'))

    _.each(formattedLog, (value, key) => {
      // don't log empty strings
      // _.trim([]) returns '' but we want to log empty arrays, so account for that
      if (_.trim(value) === '' && !_.isArray(value)) return

      if (_.includes(key, 'Diff')) {
        const logArgs = _joinLogArgs([''], _formatConsoleDiff(value))

        this.collapsedLog(_formatDiffHeader(), logArgs)

        return
      }

      const logArgs = [..._logCSS(key, 'font-weight: bold'), value]

      this.log(...logArgs)
    })
  },

  _formatted (consoleProps) {
    const maxKeyLength = this._getMaxKeyLength(consoleProps)

    return _.reduce(consoleProps, (memo, value, key) => {
      const append = ': '

      key = _.chain(key + append).capitalize().padEnd(maxKeyLength + append.length, ' ').value()
      memo[key] = value

      return memo
    }, {})
  },

  _getMaxKeyLength (obj) {
    const lengths = _(obj).keys().map('length').value()

    return Math.max(...lengths)
  },

  _logGroups (consoleProps) {
    const groups = this._getGroups(consoleProps)

    _.each(groups, (group) => {
      console.groupCollapsed(group.name)
      _.each(group.items, (value, key) => {
        if (group.label === false) {
          this.log(value)
        } else {
          this.log(`%c${key}`, 'color: blue', value)
        }
      })
      console.groupEnd()
    })
  },

  _getGroups (consoleProps) {
    const groups = _.result(consoleProps, 'groups')

    if (!groups) return

    delete consoleProps.groups

    return _.map(groups, (group) => {
      group.items = this._formatted(group.items)

      return group
    })
  },

  _logTable (consoleProps) {
    const table = this._getTable(consoleProps)

    if (!table) return

    if (_.isArray(table)) {
      console.table(table)
    } else {
      console.groupCollapsed(table.name)
      console.table(table.data, table.columns)
      console.groupEnd()
    }
  },

  _getTable (consoleProps) {
    const table = _.result(consoleProps, 'table')

    if (!table) return

    delete consoleProps.table

    return table
  },

  // expose for testing in driver/assertions_spec
  _formatConsoleDiff,
  _joinLogArgs,
  _escapeConsoleString,
}
