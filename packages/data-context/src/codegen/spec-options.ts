import assert from 'assert'
import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  erroredCodegenCandidate?: string | null
}

// Spec file extensions that we will preserve when updating the file name
// due the existence of duplicate files.
//
// Example:
//   Button.cy.ts   -> Button-copy-1.cy.ts
//   Button_spec.js -> Button-copy-1_spec.js
//   Button.foo.js  -> Button.foo-copy-1.js
export const expectedSpecExtensions = ['.cy', '.spec', '.test', '-spec', '-test', '_spec']

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

  private getSpecExtension = () => {
    if (this.options.erroredCodegenCandidate) {
      return ''
    }

    const foundSpecExtension = expectedSpecExtensions.find((specExtension) => {
      return this.parsedPath.base.endsWith(specExtension + this.parsedPath.ext)
    })

    return foundSpecExtension || ''
  }

  private async getFilename () {
    const { dir, base, ext } = this.parsedPath
    const cyWithExt = this.getSpecExtension() + ext
    const name = base.slice(0, -cyWithExt.length)

    // At this point, for a filePath of `/foo/bar/baz.cy.js`
    // - name = `baz`
    // - cyWithExt = `.cy.js`
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
