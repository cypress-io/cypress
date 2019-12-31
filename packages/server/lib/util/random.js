const random = require('randomstring')

// return a random id
const id = (length = 5) => {
  return random.generate({
    length,
    capitalization: 'lowercase',
  })
}

module.exports = {
  id,
}
