const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const Promise = require('bluebird')
const { Snapshot } = require('./snapshot')
const state = {}

module.exports = (on) => {
  const { getSnapshot, saveSnapshot, snapshotRestore } = new Snapshot(on)

  on('task', {
    'return:arg' (arg) {
      return arg
    },
    'wait' () {
      return Promise.delay(2000)
    },
    'create:long:file' () {
      const filePath = path.join(__dirname, '..', '_test-output', 'longtext.txt')
      const longText = _.times(2000).map(() => {
        return _.times(20).map(() => {
          return Math.random()
        }).join(' ')
      }).join('\n\n')

      fs.outputFileSync(filePath, longText)

      return null
    },

    getSnapshot,

    saveSnapshot,

    snapshotRestore,

    state ([key, value]) {
      if (value === undefined) {
        return state[key]
      }

      state[key] = value

      return null
    },
  })
}
