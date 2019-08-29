const termSize = require('term-size')
const env = require('./env')

const get = () => {
  const obj = termSize()

  if (env.get('CI')) {
    // reset to 100
    obj.columns = 100
  }

  return obj
}

module.exports = {
  get,
}
