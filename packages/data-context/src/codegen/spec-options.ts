import assert from 'assert'
import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  erroredCodegenCandidate?: string | null
  specFileExtension?: string
}

// Spec file extensions that we will preserve when updating the file name
// due the existence of duplicate files.
//
// Example:
//   Button.cy.ts   -> Button-copy-1.cy.ts
//   Button_spec.js -> Button-copy-1_spec.js
//   Button.foo.js  -> Button.foo-copy-1.js
export const expectedSpecExtensions = ['.cy', '.spec', '.test', '-spec', '-test', '_spec']

type ComponentExtension = `.cy.${'js' | 'ts' | 'jsx' | 'tsx'}`
type TemplateKey = 'e2e' | 'componentEmpty' | 'vueComponent'
export class SpecOptions {
  private parsedPath: ParsedPath;
  private parsedErroredCodegenCandidate?: ParsedPath

  constructor (private ctx: DataContext, private options: CodeGenOptions) {
    assert(this.ctx.currentProject)
    this.parsedPath = this.ctx.path.parse(options.codeGenPath)

    if (options.erroredCodegenCandidate) {
      this.parsedErroredCodegenCandidate = this.ctx.path.parse(options.erroredCodegenCandidate)
    }
  }

  async getCodeGenOptions () {
    if (this.options.codeGenType === 'component') {
      return this.getComponentCodeGenOptions()
    }

    return {
      codeGenType: this.options.codeGenType,
      fileName: await this.buildFileName(),
      templateKey: this.options.codeGenType as TemplateKey,
    }
  }

  private async getComponentCodeGenOptions () {
    const frontendFramework = this.ctx.actions.project.getWizardFrameworkFromConfig()

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const isDefaultSpecPattern = await this.ctx.project.getIsDefaultSpecPattern()

    // This only works for Vue projects with default spec patterns right now. If the framework is not Vue, we're generating an empty component test
    if (frontendFramework.codeGenFramework !== 'vue' || !isDefaultSpecPattern) {
      return {
        codeGenType: this.options.codeGenType,
        fileName: await this.buildFileName(),
        templateKey: 'componentEmpty' as TemplateKey,
      }
    }

    const frameworkOptions = await this.getFrameworkComponentOptions()

    return frameworkOptions
  }

  private relativePath () {
    if (!this.parsedErroredCodegenCandidate?.base) {
      return `./${this.parsedPath.base}`
    }

    const componentPathRelative = this.ctx.path.relative(this.parsedPath.dir, this.parsedErroredCodegenCandidate.dir)

    const componentPath = this.ctx.path.join(componentPathRelative, this.parsedErroredCodegenCandidate.base)

    return componentPath.startsWith('.') ? componentPath : `./${componentPath}`
  }

  private async getFrameworkComponentOptions () {
    const componentName = this.parsedErroredCodegenCandidate?.name ?? this.parsedPath.name

    const componentPath = this.relativePath()

    return {
      codeGenType: this.options.codeGenType,
      componentName,
      componentPath,
      fileName: await this.buildComponentSpecFilename(await this.getVueExtension()),
      templateKey: 'vueComponent' as TemplateKey,
    }
  }

  private async getVueExtension (): Promise<ComponentExtension> {
    try {
      const fileContent = await this.ctx.fs
      .readFile(this.options.codeGenPath, 'utf8')

      return ['lang="ts"', 'lang="typescript"'].some((lang) => fileContent.includes(lang)) ? '.cy.ts' : '.cy.js'
    } catch (e) {
      const validExtensions = ['cy.js', '.cy.jsx', '.cy.ts', '.cy.tsx']
      const possibleExtension = this.parsedPath.ext

      if (validExtensions.includes(possibleExtension)) {
        return possibleExtension as ComponentExtension
      }

      return '.cy.js'
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

  private async buildComponentSpecFilename (specExt: string) {
    const { dir, base, ext } = this.parsedPath
    const cyWithExt = this.getSpecExtension() + specExt
    const name = base.slice(0, -ext.length)

    return this.getFinalFileName(dir, name, cyWithExt, this.ctx.path.join(dir, `${name}${cyWithExt}`))
  }

  private async buildFileName () {
    const { dir, base, ext } = this.parsedPath

    const cyWithExt = this.getSpecExtension() + ext
    const name = base.slice(0, -cyWithExt.length)

    return this.getFinalFileName(dir, name, cyWithExt, this.ctx.path.join(dir, `${name}${cyWithExt}`))
  }

  private async getFinalFileName (dir: string, name: string, cyWithExt: string, fileToTry: string) {
    // At this point, for a filePath of `/foo/bar/baz.cy.js`
    // - name = `baz`
    // - cyWithExt = `.cy.js`
    let finalFileName = fileToTry

    let i = 0

    while (await this.fileExists(finalFileName)) {
      finalFileName = this.ctx.path.join(
        dir,
        `${name}-copy-${++i}${cyWithExt}`,
      )
    }

    return this.ctx.path.parse(finalFileName).base
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
