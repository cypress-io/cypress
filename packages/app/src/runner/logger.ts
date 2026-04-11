/* eslint-disable no-console */
import { pick } from '@packages/utils'

interface Table {
  name: string
  data: object
  columns: any
}

interface Group {
  name: string
  items?: any
  groups?: Group[]
  label?: boolean
  expand?: boolean
  table?: boolean
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

const resolveResult = <T>(obj: any, key: string): T | undefined => {
  const v = obj[key]

  return typeof v === 'function' ? v.call(obj) : v
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
    if (!consoleProps || Object.keys(consoleProps).length === 0) return

    // shallow clone the consoleProps to avoid mutating the original object
    const clonedConsoleProps = {
      ...consoleProps,
      props: consoleProps.props ? { ...consoleProps.props } : undefined,
      groups: consoleProps.groups ? consoleProps.groups.map((g) => ({ ...g })) : undefined,
      table: consoleProps.table ? { ...consoleProps.table } : undefined,
    }

    this._logValues(clonedConsoleProps)
    this._logArgs(clonedConsoleProps)
    this._logGroups(clonedConsoleProps)
    this._logTables(clonedConsoleProps)
  },

  _logValues (consoleProps: any) {
    consoleProps ||= {}

    const formattedLog = this._formatted({
      [consoleProps.type]: consoleProps.name,
      ...pick(consoleProps, 'error', 'snapshot'),
      ...consoleProps.props,
    })

    Object.entries(formattedLog).forEach(([key, value]) => {
      // don't log empty strings
      // trim([]) returns '' but we want to log empty arrays, so account for that
      if (typeof value === 'string' && value.trim() === '') return

      // Skip trim if we know value is an object
      if (typeof value !== 'object' && String(value).trim() === '' && !Array.isArray(value)) return

      this.log(`%c${key}`, 'font-weight: bold', value)
    })
  },

  _formatted (consoleProps: any) {
    const maxKeyLength = this._getMaxKeyLength(consoleProps)

    return Object.entries(consoleProps).reduce((memo, [key, value]) => {
      if (!key || key === 'undefined') return memo

      const append = ': '

      const formattedKey = capitalize(key + append).padEnd(maxKeyLength + append.length, ' ')

      memo[formattedKey] = value

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
    const args = resolveResult<unknown[]>(consoleProps, 'args')

    if (!args) return

    return args
  },

  _logGroups (consoleProps: any) {
    const groups = this._getGroups(consoleProps)

    groups?.forEach((group) => {
      if (group.expand) {
        console.group(group.name)
      } else {
        console.groupCollapsed(group.name)
      }

      Object.entries(group.items || {}).forEach(([key, value]) => {
        if (group.label === false) {
          this.log(value)
        } else {
          this.log(`%c${key}`, 'color: #4a90e2', value)
        }
      })

      this._logGroups(group)
      console.groupEnd()
    })
  },

  _getGroups (consoleProps: any): Group[] | undefined {
    const groups = resolveResult<Group[]>(consoleProps, 'groups')

    if (!groups) return

    const cloneGroup = (group: Group): Group => {
      return {
        ...group,
        items: this._formatted(group.items || {}),
        groups: group.groups ? group.groups.map(cloneGroup) : undefined,
      }
    }

    return groups.map(cloneGroup)
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
            const isEl = value[1] != null && (value[1] as any).nodeType === 1 && typeof (value[1] as any).tagName === 'string'

            acc[value[0]] = isEl ? getSimplifiedElementDisplay(value[1] as Element) : value[1]

            return acc
          }, {})
        })
      }

      console.group(name)
      console.table(tableData, columns)
      console.groupEnd()
    }

    if (!consoleProps.table) return

    Object.entries(consoleProps.table).sort(([a], [b]) => a.localeCompare(b)).forEach(([, getTableData]) => {
      return logTable((getTableData as () => Table)())
    })
  },
}
