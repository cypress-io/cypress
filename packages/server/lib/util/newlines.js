const addNewlineAtEveryNChar = (str, n) => {
  // Add a newline char after every 'n' char
  let result = ''

  while (str && str.length > 0) {
    result += `${str.substring(0, n)}\n`
    str = str.substring(n)
  }

  return result
}

module.exports = {
  addNewlineAtEveryNChar,
}
