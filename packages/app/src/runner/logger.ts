/* eslint-disable no-console */

import each from 'lodash/each'
import isEmpty from 'lodash/isEmpty'
import capitalize from 'lodash/capitalize'
import omit from 'lodash/omit'
import some from 'lodash/some'
import trim from 'lodash/trim'
import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import reduce from 'lodash/reduce'
import result from 'lodash/result'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import keys from 'lodash/keys'
import isFunction from 'lodash/isFunction'

interface Table {
  name: string
  data: object
  columns: any
}

interface Group {
  items: any
  label: boolean
  name: string
}

export const logger = {
  log (...args: unknown[]) {
    console.log(...args)
  },

  logError (...args: unknown[]) {
    console.error(...args)
  },

  clearLog () {
    console.clear?.()
  },

  logFormatted (consoleProps: any) {
    if (isEmpty(consoleProps)) return

    this._logValues(consoleProps)
    this._logArgs(consoleProps)
    this._logGroups(consoleProps)
    this._logTable(consoleProps)
  },

  _logValues (consoleProps: any) {
    const formattedLog = this._formatted(omit(consoleProps, 'args', 'groups', 'table'))

    each(formattedLog, (value, key) => {
      // don't log empty strings
      // trim([]) returns '' but we want to log empty arrays, so account for that
      if (isString(value) && trim(value) === '') return

      // Skip trim if we know value is an object
      if (typeof value !== 'object' && trim(value) === '' && !isArray(value)) return

      this.log(`%c${key}`, 'font-weight: bold', value)
    })
  },

  _formatted (consoleProps: any) {
    const maxKeyLength = this._getMaxKeyLength(consoleProps)

    return reduce(consoleProps, (memo, value, key) => {
      const append = ': '

      key = capitalize(key + append).padEnd(maxKeyLength + append.length, ' ')
      memo[key] = value

      return memo
    }, {})
  },

  _getMaxKeyLength (obj: object) {
    const lengths = Object.keys(obj).map((x) => x.length)

    return Math.max(...lengths)
  },

  _logArgs (consoleProps: any) {
    const args = this._getArgs(consoleProps)

    if (!args) return

    this.log(`%cArgs:`, 'font-weight: bold')

    args.forEach((arg, index) => {
      this.log(`%c  [${index}]:`, 'font-weight: bold', arg)
    })
  },

  _getArgs (consoleProps: any) {
    const args = result<unknown[]>(consoleProps, 'args')

    if (!args) return

    return args
  },

  _logGroups (consoleProps: any) {
    const groups = this._getGroups(consoleProps)

    each(groups, (group) => {
      console.groupCollapsed(group.name)
      each(group.items, (value, key) => {
        if (group.label === false) {
          this.log(value)
        } else {
          this.log(`%c${key}`, 'color: blue', value)
        }
      })

      console.groupEnd()
    })
  },

  _getGroups (consoleProps: any): Group[] | undefined {
    const groups = result<Group[]>(consoleProps, 'groups')

    if (!groups) return

    return map(groups, (group) => {
      group.items = this._formatted(group.items)

      return group
    })
  },

  _logTable (consoleProps: any) {
    if (isMultiEntryTable(consoleProps.table)) {
      each(
        sortBy(consoleProps.table, (val, key) => key),
        (table) => {
          return this._logTable({ table })
        },
      )

      return
    }

    const table = this._getTable(consoleProps)

    if (!table) return

    if (isArray(table)) {
      console.table(table)
    } else {
      console.group(table.name)
      console.table(table.data, table.columns)
      console.groupEnd()
    }
  },

  _getTable (consoleProps: any): Table | Table[] | undefined {
    const table = result<Table | Table[]>(consoleProps, 'table')

    if (!table) return

    return table
  },
}

const isMultiEntryTable = (table: Table) => {
  return !isFunction(table) &&
  !some(keys(table)
  .map((x) => isNaN(parseInt(x, 10)))
  .filter(Boolean), true)
}
