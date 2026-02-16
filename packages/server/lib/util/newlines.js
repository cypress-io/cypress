const util = require('util')

const addNewlineAtEveryNChar = (str, n) => {
  if (!str) {
    return str
  }

  let result = []
  let idx = 0

  let printableString = util.stripVTControlCharacters(str)

  if (printableString.length !== str.length) {
    if (printableString.length <= n) {
      return str
    } else {
      str = printableString
    }
  }

  while (idx < str.length) {
    result.push(str.slice(idx, idx += n))
  }

  return result.join('\n')
}

module.exports = {
  addNewlineAtEveryNChar,
}
