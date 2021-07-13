// @ts-check
const projectRoot = import.meta.env.__cypress_projectRoot

// cypress internal files start with cypress:///
const cypressRE = / \(cypress:\/\/\/[^\)]+\)/
// stack line start with a space or a tab
const stackLineRE = /^[ \t]+/
// sometimes stack contains parens and the only content we care about is within
const lineParensRE = / \(([^\)]+)\)$/
// thsis how we extract filename, column and line num
const lineInfoRE = /([^\?]+)\?import\:(\d+)\:(\d+)$/

export function getMochaHookInvocationDetails (stack) {
  const lines = stack.split('\n')

  const stackLines = lines.filter((line) => stackLineRE.test(line))

  const relevantLines = stackLines.filter((line) => !cypressRE.test(line))

  if (!relevantLines.length) {
    return {}
  }

  const firstLine = relevantLines[0]
  .replace(/ at /, '')
  .replace(`${window.location.protocol }//${ window.location.host}`, '')
  .trim()
  .replace(/^\/@fs\//, '')

  const firstLineNoParensObj = lineParensRE.exec(firstLine)

  const firstLineNoParens = firstLineNoParensObj ? firstLineNoParensObj[1] : firstLine

  const firstLineObj = lineInfoRE.exec(firstLineNoParens)

  if (!firstLineObj) {
    return {}
  }

  const [, filePath, lineStr, columnStr] = firstLineObj

  const line = parseInt(lineStr, 10)
  const column = parseInt(columnStr, 10)

  const absoluteFile = filePath.startsWith(projectRoot) ? filePath : `${projectRoot}${filePath}`
  const relativeFile = filePath.startsWith(projectRoot) ? filePath.slice(projectRoot.length) : filePath

  const details = {
    absoluteFile,
    relativeFile,
    line,
    column,
  }

  return {
    stack: stackLines.join('\n'),
    details,
  }
}
