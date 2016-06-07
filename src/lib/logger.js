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

  logFormatted (logInstance) {
    const log = _.invoke(logInstance.attributes, 'onConsole', logInstance.attributes)
    if (_.isEmpty(log)) return

    this._logValues(log)
    this._logGroups(log)
    this._logTable(log)
  },

  _logValues (log) {
    const formattedLog = this._formatted(_.omit(log, 'groups', 'table'))

    _.each(formattedLog, (value, key) => {
      if (_.trim(value) === '' && value !== '' || _.isArray(value)) return

      this.log(`%c${key}`, 'font-weight: bold', value)
    })
  },

  _formatted (log) {
    const maxKeyLength = this._getMaxKeyLength(log)
    return _.reduce(log, (memo, value, key) => {
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

  _logGroups (log) {
    const groups = this._getGroups(log)
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

  _getGroups (log) {
    const groups = _.result(log, 'groups')
    if (!groups) return

    delete log.groups
    return _.map(groups, (group) => {
      group.items = this._formatted(group.items)
      return group
    })
  },

  _logTable (log) {
    const table = this._getTable(log)
    if (!table) return

    if (_.isArray(table)) {
      console.table(table)
    } else {
      console.groupCollapsed(table.name)
      console.table(table.data, table.columns)
      console.groupEnd()
    }
  },

  _getTable (log) {
    const table = _.result(log, 'table')
    if (!table) return

    delete log.table
    return table
  },
}
