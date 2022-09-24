const CA = require('./ca')
const Server = require('./server')

module.exports = {
  create (dir, port, options) {
    return CA.create(dir)
    .then((ca) => {
      return Server.create(ca, port, options)
    })
  },

  reset () {
    return Server.reset()
  },

  httpsServer (onRequest) {
    const testServer = 'https_server'

    return require(`../test/helpers/${testServer}`).create(onRequest)
  },

}
