/* eslint-disable no-console */

import _ from 'lodash'

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

  _logValues (consoleProps) {
    const formattedLog = this._formatted(_.omit(consoleProps, 'groups', 'table'))

    _.each(formattedLog, (value, key) => {
      // don't log empty strings
      // _.trim([]) returns '' but we want to log empty arrays, so account for that
      if (_.trim(value) === '' && !_.isArray(value)) return

      this.log(`%c${key}`, 'font-weight: bold', value)
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

    return _.map(groups, (group) => {
      group.items = this._formatted(group.items)

      return group
    })
  },

  _logTable (consoleProps) {
    if (isMultiEntryTable(consoleProps.table)) {
      _.each(
        _.sortBy(consoleProps.table, (val, key) => key),
        (table) => {
          return this._logTable({ table })
        },
      )

      return
    }

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

    return table
  },
}

const isMultiEntryTable = (table) => !_.isFunction(table) && !_.some(_.keys(table).map(isNaN).filter(Boolean), true)
