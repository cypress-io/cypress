/* eslint-disable no-console */

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const _ = require('lodash')
const execa = require('execa')
const os = require('os')
const util = require('util')
const si = require('systeminformation')

let timings; let intervalId

module.exports = (on, config) => {
  on('task', {
    'console' (...args) {
      console.log(...args)

      return null
    },
    'stop:capture:memory' () {
      clearInterval(intervalId)
      console.log('memory', util.inspect(timings, {
        compact: true,
        breakLength: Infinity,
        maxArrayLength: Infinity,
      }))

      console.log('details', {
        min: _.min(timings),
        max: _.max(timings),
        average: _.chain(timings).sum().divide(timings.length).value(),
      })

      return null
    },
    'capture:memory' () {
      if (os.platform() === 'linux') {
        clearInterval(intervalId)
        timings = []
        intervalId = setInterval(() => {
          execa('free', ['-m'])
          .then(({ stdout }) => {
            si.mem()
            .then((data) => {
              console.log(stdout)
              const avail = _
              .chain(stdout)
              .split('\n')
              .nth(1)
              .split(' ')
              .last()
              .toNumber()
              .value()

              console.log(avail)
              timings.push(avail)
              console.log('systeminformation: ', data)
            })
          })
        }, 1000)
      }

      return null
    },
  })
}
