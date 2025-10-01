import _ from 'lodash'
import Bluebird from 'bluebird'
import pkg from '@packages/root'
import api from './api'
import user from './user'
import system from '../util/system'
import { stripPath } from './strip_path'

export = {
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
      const [body, authToken] = await Bluebird.all([
        this.getBody(err),
        this.getAuthToken(),
      ])

      await api.createCrashReport(body, authToken)
    } catch (_err) {
      // nothing to do
    }
  },
}
