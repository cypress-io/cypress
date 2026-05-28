import _ from 'lodash'
import pkg from '@packages/root'
import api from './api'
import user from './user'
import * as system from '../util/system'
import { stripPath } from './strip_path'

const { serializeError } = require('serialize-error')

const exception = {
  /**
   * Safely serializes an error object to a string, handling circular references
   * and other non-serializable values that would cause JSON.stringify to throw.
   */
  safeErrorSerialize (error: unknown): string {
    if (typeof error === 'string') {
      return error
    }

    try {
      // Use serialize-error package to handle complex error objects safely
      const serialized = serializeError(error)

      const result = JSON.stringify(serialized)

      // JSON.stringify returns undefined for undefined input, but we need to return a string
      if (typeof result === 'undefined') {
        return 'undefined'
      }

      return result
    } catch (e) {
      // If even serialize-error fails, use a generic fallback
      return `[Non-serializable object: ${error?.constructor?.name || 'Object'}]`
    }
  },

  getErr (err: Error) {
    return {
      name: stripPath(err.name),
      message: stripPath(err.message),
      stack: stripPath(err.stack as string),
    }
  },

  getVersion () {
    return pkg.version
  },

  getBody (err: Error) {
    return system.info()
    .then((systemInfo) => {
      return _.extend({
        err: this.getErr(err),
        version: this.getVersion(),
      }, systemInfo)
    })
  },

  async getAuthToken () {
    return user.get().then((user) => {
      return user && user.authToken
    })
  },

  async create (err: Error) {
    if ((process.env['CYPRESS_INTERNAL_ENV'] !== 'production') ||
       (process.env['CYPRESS_CRASH_REPORTS'] === '0')) {
      return
    }

    try {
      const [body, authToken] = await Promise.all([
        this.getBody(err),
        this.getAuthToken(),
      ])

      await api.createCrashReport(body, authToken)
    } catch (_err) {
      // nothing to do
    }
  },
}

export default exception
