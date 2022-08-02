const addNewlineAtEveryNChar = (str, n) => {
  if (!str) {
    return str
  }

  let result = []
  let idx = 0

  while (idx < str.length) {
    result.push(str.slice(idx, idx += n))
  }

  return result.join('\n')
}

module.exports = {
  addNewlineAtEveryNChar,
}
