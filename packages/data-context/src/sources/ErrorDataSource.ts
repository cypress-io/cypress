import { ErrorWrapperSource, stackUtils } from '@packages/errors'
import path from 'path'
import _ from 'lodash'
import { codeFrameColumns } from '@babel/code-frame'
import os from 'os'
import type { DataContext } from '..'

const tsxCodeFrameFilter = '/node_modules/tsx/dist/register'
const windowsTsxCodeFrameFilter = tsxCodeFrameFilter.replaceAll('/', '\\')
const isWindows = os.platform() === 'win32'

export interface CodeFrameShape {
  line: number
  column: number
  absolute: string
  codeBlock: string
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

    // If we saw a TransformError, or a esbuild error we will extract the error location from the message
    const compilerErrorLocation = source.cypressError.originalError?.compilerErrorLocation

    let line: number | null | undefined
    let column: number | null | undefined
    let absolute: string | null | undefined

    if (compilerErrorLocation) {
      line = compilerErrorLocation.line
      column = compilerErrorLocation.column
      absolute = path.join(this.ctx.currentProject, compilerErrorLocation.filePath)
    } else {
      // Skip any stack trace lines which come from node:internal code
      const stackLines = stackUtils.getStackLines(source.cypressError.stack ?? '')

      // we want to filter out any tsx transformation code in the stack to help identify the error. Windows stack can have both posix paths and dos paths so we need to filter both (last line is a no-op on posix as its the same thing)
      const filteredStackLines = stackLines.filter((stackLine) => !stackLine.includes('node:electron') && !stackLine.includes('node:internal') && !stackLine.includes('source-map-support') && !stackLine.includes(tsxCodeFrameFilter) && !(isWindows && stackLine.includes(windowsTsxCodeFrameFilter)))
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

    const codeBlock = codeFrameColumns(await this.ctx.fs.readFile(absolute, 'utf8'), {
      start: { line, column },
    }, {
      linesAbove: 2,
      linesBelow: 4,
    })

    return {
      absolute,
      line,
      column,
      codeBlock,
    }
  }
}
