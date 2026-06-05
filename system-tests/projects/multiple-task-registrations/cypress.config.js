module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('task', {
        'one' () {
          return 'one'
        },
        'two' () {
          return 'two'
        },
      })

      on('task', {
        'two' () {
          return 'two again'
        },
        'three' () {
          return 'three'
        },
      })

      return config
    },
  },
}
