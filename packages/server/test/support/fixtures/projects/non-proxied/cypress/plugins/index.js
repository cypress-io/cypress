const os = require('os')

module.exports = (on, config) => {
  on('task', {
    'get:tmp:path': () => {
      return os.tmpdir()
    },
  })
}
