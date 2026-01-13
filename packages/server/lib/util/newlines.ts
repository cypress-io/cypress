const addNewlineAtEveryNChar = (str: string | undefined | null, n: number): string | undefined | null => {
  if (!str) {
    return str
  }

  let result: string[] = []
  let idx = 0

  while (idx < str.length) {
    result.push(str.slice(idx, idx += n))
  }

  return result.join('\n')
}

export { addNewlineAtEveryNChar }

export default {
  addNewlineAtEveryNChar,
}

module.exports = {
  addNewlineAtEveryNChar,
}
