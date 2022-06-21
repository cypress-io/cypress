/* eslint-disable no-console */
const EventEmitter = require('events')

class EventBugFix {
  constructor (on_reference) {
    this.emitter = new EventEmitter()
    this.on_reference = on_reference
    this.proxied_events = [
      'before:run',
      'after:run',
      'before:spec',
      'after:spec',
    ]

    this.proxied_events.forEach((event) => {
      on_reference(event, (...args) => {
        this.emitter.emit(event, ...args)
      })
    })
  }
  on (event, ...args) {
    if (this.proxied_events.indexOf(event) !== -1) {
      this.emitter.on(event, ...args)
    } else {
      this.on_reference(event, ...args)
    }
  }
}

module.exports = {
  'fixturesFolder': false,
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      // Run test with RUN_MULTIPLE_PASS=true to show test pass
      if (process.env.RUN_MULTIPLE_PASS) {
        const _bugFix = new EventBugFix(on)

        on = _bugFix.on.bind(_bugFix)
      }

      on('before:run', (runDetails) => {
        console.log('before:run first handler')
      })

      on('before:run', (runDetails) => {
        console.log('before:run second handler')
      })

      on('after:run', (results) => {
        console.log('after:run first handler')
      })

      on('after:run', (results) => {
        console.log('after:run second handler')
      })

      on('before:spec', (spec) => {
        console.log('before:spec first handler')
      })

      on('before:spec', (spec) => {
        console.log('before:spec second handler')
      })

      on('after:spec', (spec, results) => {
        console.log('after:spec first handler')
      })

      on('after:spec', (spec, results) => {
        console.log('after:spec second handler')
      })

      return config
    },
  },
}
