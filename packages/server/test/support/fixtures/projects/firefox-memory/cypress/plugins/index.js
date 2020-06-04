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
const util = require('util')
const si = require('systeminformation')

let timings = []
let rss = []
let intervalId

module.exports = (on, config) => {
  on('task', {
    'console' (...args) {
      console.log(...args)

      return null
    },
    'stop:capture:memory' () {
      clearInterval(intervalId)
      console.log('available memory', util.inspect(timings, {
        compact: true,
        breakLength: Infinity,
        maxArrayLength: Infinity,
      }))

      console.log('details of available memory', {
        min: _.min(timings),
        max: _.max(timings),
        average: _.chain(timings).sum().divide(timings.length).value(),
      })

      console.log('firefox rss', util.inspect(rss, {
        compact: true,
        breakLength: Infinity,
        maxArrayLength: Infinity,
      }))

      console.log('details of firefox rss', {
        min: _.min(rss),
        max: _.max(rss),
        average: _.chain(rss).sum().divide(rss.length).value(),
      })

      return null
    },
    'capture:memory' () {
      clearInterval(intervalId)

      timings = []

      intervalId = setInterval(() => {
        execa('free', ['-m'])
        .then(({ stdout }) => {
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
        })
      }, 1000)

      return null
    },
    'log:memory' () {
      return si.processes()
      .then(({ list }) => {
        const totalRss = _.chain(list)
        // BLOCKING TODO: need to make this detect firefox that are children of Cypress
        // *only* using parent pid and pid, otherwise it will detect the user's
        // Firefox
        .filter((proc) => {
          return ['firefox', 'firefox-bin'].includes(proc.command)
        })
        .sumBy('mem_rss')
        .thru((kb) => {
          return Math.round(kb / 1024) // mb
        })
        .value()

        console.log({ totalRss })

        rss.push(totalRss)

        return null
      })
    },
  })
}
