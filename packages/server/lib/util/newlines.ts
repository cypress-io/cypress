import util from 'util'

export const addNewlineAtEveryNChar = (str: string, n: number) => {
  if (!str) {
    return str
  }

  const result: string[] = []
  let idx = 0

  const printableString = util.stripVTControlCharacters(str)

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
