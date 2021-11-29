import _ from 'lodash'
import type { DataContext } from '..'

/**
 * Manages the lifecycle of a "plugin"
 */
export class PluginsManager {
  private _handlers = []
  private _registeredEvents: Record<string, Function> = {}

  constructor (private ctx: DataContext) {}

  register (event: string, callback: Function) {
    this.ctx.debug(`register event '${event}'`)

    if (!_.isString(event)) {
      throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
    }

    if (!_.isFunction(callback)) {
      throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
    }

    this._registeredEvents[event] = callback
  }

  private clientSideError (err: any) {
    // eslint-disable-next-line no-console
    console.log(err.message)

    err = this.errorMessage(err)

    return `\
  (function () {
    Cypress.action("spec:script:error", {
      type: "BUNDLE_ERROR",
      error: ${JSON.stringify(err)}
    })
  }())\
  `
  }

  private errorMessage (err: any = {}) {
    return err.stack || err.annotated || err.message || err.toString()
  }
}
