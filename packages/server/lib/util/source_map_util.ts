import _ from 'lodash'
import StackUtils from 'stack-utils'
import { Position, RawSourceMap, SourceMapConsumer } from 'source-map'

const baseSourceMapRegex = "\\s*[@#]\\s*sourceMappingURL\\s*=\\s*([^\\s]*)(?![\\S\\s]*sourceMappingURL)"
const regexCommentStyle1 = new RegExp("/\\*"+baseSourceMapRegex+"\\s*\\*/") // matches /* ... */ comments
const regexCommentStyle2 = new RegExp("//"+baseSourceMapRegex+"($|\n|\r\n?)") // matches // .... comments
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

export const getStackDetails = (stackString: string, lineIndex: number = 0, cwd?: string) => {
  const stack = new StackUtils({ cwd, internals: StackUtils.nodeInternals() });
  const line = stack.clean(stackString).split('\n')[lineIndex]

  return stack.parseLine(line)
}

export const extractSourceMap = (code: string) => {
  const match = code.match(regexCommentStyle1) || code.match(regexCommentStyle2)

  if (!match) {
    throw new Error('Code does not contain a source map url')
  }

  const url = match[1]
  const dataUrlMatch = regexDataUrl.exec(url) || []
  const mapBase64 = dataUrlMatch[1]
  const mapString = Buffer.from(mapBase64, 'base64').toString()

  let rawSourceMap
  try {
    rawSourceMap = JSON.parse(mapString)
  } catch (err) {
    throw new Error(`Cannot parse inline source map: ${err.stack}`)
  }

  return rawSourceMap
}

export const getSourcePosition = (rawSourceMap: RawSourceMap, position: Position) => {
  return SourceMapConsumer.with(rawSourceMap, null, (consumer) => {
    const originalPosition = consumer.originalPositionFor(position)
    return _.pick(originalPosition, 'line', 'column')
  })
}

export const getContentsOfLines = (fileContents: string, startLineNumber: number, endLineNumber: number) => {
  const lines = fileContents.split('\n')
  return lines.splice(startLineNumber - 1, endLineNumber - startLineNumber + 1).join('\n')
}
