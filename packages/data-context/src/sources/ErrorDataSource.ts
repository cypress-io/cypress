import { ErrorWrapperSource, stackUtils } from '@packages/errors'
import path from 'path'
import _ from 'lodash'

import type { DataContext } from '..'

export interface CodeFrameShape {
  line: number
  column: number
  absolute: string
  codeBlock: string
  codeBlockStartLine: number
}

export class ErrorDataSource {
  constructor (private ctx: DataContext) {}

  isUserCodeError (source: ErrorWrapperSource) {
    return Boolean(source.cypressError.originalError && !source.cypressError.originalError?.isCypressErr)
  }

  async codeFrame (source: ErrorWrapperSource): Promise<CodeFrameShape | null> {
    if (!this.ctx.currentProject || !this.isUserCodeError(source)) {
      return null
    }

    // If we saw a TSError, we will extract the error location from the message
    const tsErrorLocation = source.cypressError.originalError?.tsErrorLocation

    let line: number | null | undefined
    let column: number | null | undefined
    let absolute: string | null | undefined

    if (tsErrorLocation) {
      line = tsErrorLocation.line
      column = tsErrorLocation.column
      absolute = path.join(this.ctx.currentProject, tsErrorLocation.filePath)
    } else {
      // Skip any stack trace lines which come from node:internal code
      const stackLines = stackUtils.getStackLines(source.cypressError.stack ?? '')
      const filteredStackLines = stackLines.filter((stackLine) => !stackLine.includes('node:internal'))
      const parsedLine = stackUtils.parseStackLine(filteredStackLines[0] ?? '')

      if (parsedLine) {
        absolute = parsedLine.absolute
        line = parsedLine.line
        column = parsedLine.column
      }
    }

    if (!absolute || !_.isNumber(line) || !_.isNumber(column)) {
      return null
    }

    const fileContents = await this.ctx.file.readFile(absolute)

    const lines = fileContents.split('\n')

    const linesAbove = 2
    const linesBelow = 6

    const startLine = Math.max(1, line - linesAbove)
    const endLine = Math.min(lines.length, line + linesBelow)

    // Start & end line start at 1, rather than being zero indexed, so we subtract 1 from the
    // line numbers when slicing
    const codeBlock = lines.slice(startLine - 1, endLine - 1).join('\n')

    return {
      absolute,
      line,
      column,
      codeBlockStartLine: startLine,
      codeBlock,
    }
  }
}
