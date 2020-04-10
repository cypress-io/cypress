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
    return require('../test/helpers/https_server').create(onRequest)
  },

}
