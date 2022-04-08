import assert from 'assert'
import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  specFileExtension: string
  erroredCodegenCandidate?: string | null
}

export class SpecOptions {
  private parsedPath: ParsedPath;

  constructor (private ctx: DataContext, private options: CodeGenOptions) {
    assert(this.ctx.currentProject)
    this.parsedPath = this.ctx.path.parse(options.codeGenPath)
  }

  async getCodeGenOptions () {
    return {
      codeGenType: this.options.codeGenType,
      fileName: await this.getFilename(),
    }
  }

  private async getFilename () {
    const { dir, base, ext } = this.parsedPath
    const cyWithExt = this.options.specFileExtension + ext
    const name = base.slice(0, -cyWithExt.length)

    let fileToTry = this.ctx.path.join(dir, `${name}${cyWithExt}`)

    let i = 0

    while (await this.fileExists(fileToTry)) {
      fileToTry = this.ctx.path.join(
        dir,
        `${name}-copy-${++i}${cyWithExt}`,
      )
    }

    return this.ctx.path.parse(fileToTry).base
  }

  private async fileExists (absolute: string) {
    try {
      await this.ctx.fs.access(absolute, this.ctx.fs.constants.F_OK)

      return true
    } catch (e) {
      return false
    }
  }
}
