const baseSourceMapRegex = '\\s*[@#]\\s*sourceMappingURL\\s*=\\s*([^\\s]*)(?![\\S\\s]*sourceMappingURL)'
const regexCommentStyle1 = new RegExp(`/\\*${baseSourceMapRegex}\\s*\\*/`) // matches /* ... */ comments
const regexCommentStyle2 = new RegExp(`//${baseSourceMapRegex}($|\n|\r\n?)`) // matches // .... comments
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

// const insertStringAtIndex = (string, stringToInsert, index) => {
//   return `${string.slice(0, index)}${stringToInsert}${string.slice(index)}`
// }

// TODO: clean this up when spec is done or use a WeakMap
const sourceMaps = {}

export const extractSourceMap = (file: object, fileContents: string) => {
  const sourceMapMatch = fileContents.match(regexCommentStyle1) || fileContents.match(regexCommentStyle2)

  if (!sourceMapMatch) {
    return
  }

  const url = sourceMapMatch[1]
  // const index = sourceMapMatch.index
  const dataUrlMatch = url.match(regexDataUrl)

  if (!dataUrlMatch) {
    return
  }

  const sourceMapBase64 = dataUrlMatch[1]

  // TODO: fix this
  // @ts-ignore
  sourceMaps[file.fullyQualified] = {
    file,
    sourceMapBase64,
  }
  // const embed = `window.Cypress.onSourceMap(${JSON.stringify(file)}, '${sourceMapBase64}');\n`

  // return insertStringAtIndex(fileContents, embed, index)
}

export const getSourceMapForFile = (file: string) => {
  return sourceMaps[file] || {}
}
