/* eslint-disable no-console */
import _ from 'lodash'

interface Table {
  name: string
  data: object
  columns: any
}

interface Group {
  name: string
  items?: any
  label?: boolean
  expand?: boolean
  table?: boolean
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
    if (_.isEmpty(consoleProps)) return

    this._logValues(consoleProps)
    this._logArgs(consoleProps)
    this._logGroups(consoleProps)
    this._logTables(consoleProps)
  },

  _logValues (consoleProps: any) {
    consoleProps ||= {}

    const formattedLog = this._formatted({
      [consoleProps.type]: consoleProps.name,
      ..._.pick(consoleProps, 'error', 'snapshot'),
      ...consoleProps.props,
    })

    _.each(formattedLog, (value, key) => {
      // don't log empty strings
      // trim([]) returns '' but we want to log empty arrays, so account for that
      if (_.isString(value) && _.trim(value) === '') return

      // Skip trim if we know value is an object
      if (typeof value !== 'object' && _.trim(value) === '' && !_.isArray(value)) return

      this.log(`%c${key}`, 'font-weight: bold', value)
    })
  },

  _formatted (consoleProps: any) {
    const maxKeyLength = this._getMaxKeyLength(consoleProps)

    return _.reduce(consoleProps, (memo, value, key) => {
      if (!key || key === 'undefined') return memo

      const append = ': '

      key = _.capitalize(key + append).padEnd(maxKeyLength + append.length, ' ')
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
    const args = _.result<unknown[]>(consoleProps, 'args')

    if (!args) return

    return args
  },

  _logGroups (consoleProps: any) {
    const groups = this._getGroups(consoleProps)

    _.each(groups, (group) => {
      if (group.expand) {
        console.group(group.name)
      } else {
        console.groupCollapsed(group.name)
      }

      _.each(group.items, (value, key) => {
        if (group.label === false) {
          this.log(value)
        } else {
          this.log(`%c${key}`, 'color: blue', value)
        }
      })

      this._logGroups(group)
      console.groupEnd()
    })
  },

  _getGroups (consoleProps: any): Group[] | undefined {
    const groups = _.result<Group[]>(consoleProps, 'groups')

    if (!groups) return

    return _.map(groups, (group) => {
      group.items = this._formatted(group.items || {})

      return group
    })
  },

  _logTables (consoleProps: any) {
    const logTable = ({ name, data, columns }) => {
      let tableData = data

      if (Cypress.isBrowser('webkit')) {
        // WebKit will hang when we attempt to log element references
        // within a table. We replace the element with a simplified display
        // string in this case.
        // https://bugs.webkit.org/show_bug.cgi?id=244100

        const getSimplifiedElementDisplay = (element: Element) => {
          let display = element.tagName.toLowerCase()

          if (element.id) {
            display += `#${element.id}`
          }

          element.classList.forEach((className) => {
            display += `.${className}`
          })

          return display
        }

        tableData = data.map((rowObj) => {
          return Object.entries(rowObj).reduce((acc: any, value) => {
            acc[value[0]] = _.isElement(value[1]) ? getSimplifiedElementDisplay(value[1] as Element) : value[1]

            return acc
          }, {})
        })
      }

      console.group(name)
      console.table(tableData, columns)
      console.groupEnd()
    }

    _.each(_.sortBy(consoleProps.table, (val, key) => key), (getTableData: () => Table) => {
      return logTable(getTableData())
    })
  },
}
