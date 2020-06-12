const stripIndent = (strings, ...args) => {
  const parts = []

  for (let i = 0; i < strings.length; i++) {
    parts.push(strings[i])

    if (i < strings.length - 1) {
      parts.push(`<<${i}>>`)
    }
  }

  const lines = parts.join('').split('\n')
  const firstLine = lines[0].length === 0 ? lines[1] : lines[0]
  let indentSize = 0

  for (let i = 0; i < firstLine.length; i++) {
    if (firstLine[i] === ' ') {
      indentSize++
      continue
    }

    break
  }

  const strippedLines = lines.map((line) => line.substring(indentSize))

  let result = strippedLines.join('\n').trimLeft()

  args.forEach((arg, i) => {
    result = result.replace(`<<${i}>>`, `${arg}`)
  })

  return result
}

module.exports = {
  stripIndent,
}
