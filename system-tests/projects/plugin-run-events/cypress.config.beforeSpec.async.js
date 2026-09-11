module.exports = {
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('before:spec', (args) => {
        console.log('<---- before:spec promise start')
        console.log('received args', args)

        return new Promise((res) => {
          return setTimeout(() => {
            console.log('----> before:spec: Promise resolved!')
            res()
          }, 5000)
        })
      })

      return config
    },
  },
}
