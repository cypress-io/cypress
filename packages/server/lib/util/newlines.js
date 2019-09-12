const R = require('ramda')

const addNewlineAtEveryNChar = (str, n) => {
  // Add a newline char after every 'n' char
  return R.splitEvery(n, str).join('\n')
}

module.exports = {
  addNewlineAtEveryNChar,
}
