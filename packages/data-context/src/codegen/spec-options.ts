import type { ParsedPath } from 'path'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'
import fs from 'fs-extra'
import { uniq, upperFirst } from 'lodash'
import path from 'path'
import { FileExtension, getDefaultSpecFileName } from '../sources/migration/utils'
import { toPosix } from '../util'
import type { FoundSpec } from '@packages/types'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  isDefaultSpecPattern: boolean
  specPattern: string[]
  currentProject: string | null
  framework?: Cypress.ResolvedComponentFrameworkDefinition
  specs?: FoundSpec[]
  componentName?: string
  isDefault?: boolean
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
type TemplateKey = 'e2e' | 'componentEmpty' | 'vueComponent' | 'reactComponent'
export class SpecOptions {
  private parsedPath: ParsedPath

  constructor (private options: CodeGenOptions) {
    this.parsedPath = path.parse(options.codeGenPath)
  }

  async getCodeGenOptions () {
    if (this.options.codeGenType === 'component') {
      return this.getComponentCodeGenOptions()
    }

    return {
      codeGenType: this.options.codeGenType,
      fileName: await this.buildFileName(),
      templateKey: this.options.codeGenType as TemplateKey,
      overrideCodeGenDir: '',
    }
  }

  private async getComponentCodeGenOptions () {
    if (!this.options.framework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    switch (this.options.framework.codeGenFramework) {
      case 'react':
        return await this.getReactSpecOptions()
      case 'vue':
        return await this.getVueSpecOptions()
      default:
        throw new Error(`Unable to generate spec for ${this.options.framework.codeGenFramework}`)
    }
  }

  private getRelativePathToComponent (specParsedPath?: ParsedPath) {
    if (specParsedPath) {
      const componentPathRelative = path.relative(specParsedPath.dir, this.parsedPath.dir)

      const componentPath = path.join(componentPathRelative, this.parsedPath.base)

      return toPosix(componentPath.startsWith('.') ? componentPath : `./${componentPath}`)
    }

    return `./${this.parsedPath.base}`
  }

  private async getVueSpecOptions () {
    const componentName = this.buildComponentNameFromFilename(this.parsedPath.name)

    const extension = await this.getVueExtension()

    let parsedSpecPath: ParsedPath | undefined

    // If we have a custom spec pattern, write the spec to a path that matches the pattern instead of the component directory
    if (!this.options.isDefaultSpecPattern) {
      parsedSpecPath = path.parse(await getDefaultSpecFileName({
        currentProject: this.options.currentProject,
        testingType: 'component',
        fileExtensionToUse: (extension === '.cy.ts' || extension === '.cy.tsx') ? 'ts' : 'js',
        specPattern: this.options.specPattern,
        name: componentName,
        specs: this.options.specs }))
    }

    // The path to import the component from
    const componentPath = this.getRelativePathToComponent(parsedSpecPath)

    return {
      codeGenType: this.options.codeGenType,
      componentName,
      componentPath,
      fileName: await this.buildComponentSpecFilename(extension, parsedSpecPath),
      templateKey: 'vueComponent' as TemplateKey,
      overrideCodeGenDir: parsedSpecPath?.dir,
    }
  }

  private async getReactSpecOptions () {
    // For React specs, use the component name that the user selected. Otherwise fall back to the component file name.
    const componentName = this.options.componentName || this.parsedPath.name

    let parsedSpecPath: ParsedPath | undefined

    // If we have a custom spec pattern, write the spec to a path that matches the pattern instead of the component directory
    if (!this.options.isDefaultSpecPattern) {
      parsedSpecPath = path.parse(await getDefaultSpecFileName({
        currentProject: this.options.currentProject,
        testingType: 'component',
        fileExtensionToUse: this.parsedPath.ext as FileExtension,
        specPattern: this.options.specPattern,
        name: componentName,
        specs: this.options.specs }))
    }

    // The path to import the component from
    const componentPath = path.parse(this.getRelativePathToComponent(parsedSpecPath))

    const extension = `.cy${this.parsedPath.ext}`

    return {
      codeGenType: this.options.codeGenType,
      componentName,
      componentPath: `${componentPath.dir}/${componentPath.name}`,
      // If the component name and file name are different, the spec file should be combined (ex: SpecNameComponentName.cy.xx)
      fileName: await this.buildComponentSpecFilename(extension, parsedSpecPath, uniq([this.parsedPath.name, componentName]).join('')),
      templateKey: 'reactComponent' as TemplateKey,
      overrideCodeGenDir: parsedSpecPath?.dir,
      isDefault: this.options.isDefault,
    }
  }

  private async getVueExtension (): Promise<ComponentExtension> {
    try {
      const fileContent = await fs
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

  private getSpecExtension = (filePath?: ParsedPath) => {
    const foundSpecExtension = expectedSpecExtensions.find((specExtension) => {
      return filePath ? filePath.base.endsWith(specExtension + filePath.ext) :
        this.parsedPath.base.endsWith(specExtension + this.parsedPath.ext)
    })

    return foundSpecExtension || ''
  }

  private buildComponentNameFromFilename (fileNameWithoutExt: string): string {
    const sanitizedName = fileNameWithoutExt
    // Remove any characters from the filename that aren't allowed within a JS variable name (but leave periods and hyphens)
    .replaceAll(/[^a-z_\d$.-]/gi, '')
    // Remove any groupings of multiple periods (eg, '...all') but leave single periods alone
    .replaceAll(/[.]{2,}/g, '')

    // Convert period- and hyphen-delimited portions to PascalCase
    // eg, 'test.page.ts' => 'TestPage', 'about.component.vue' => 'AboutComponent'
    return sanitizedName.split(/[-.]/g)
    .map(upperFirst)
    .join('')
  }

  private buildComponentSpecFilename (specExt: string, filePath?: ParsedPath, fileName?: string) {
    const { dir, base, ext } = filePath || this.parsedPath
    const cyWithExt = this.getSpecExtension(filePath) + ext

    const name = fileName || base.slice(0, -cyWithExt.length)

    const finalExtension = filePath ? cyWithExt : specExt

    return this.getFinalFileName(dir, name, finalExtension, path.join(dir, `${name}${finalExtension}`))
  }

  private async buildFileName () {
    const { dir, base, ext } = this.parsedPath

    const cyWithExt = this.getSpecExtension() + ext
    const name = base.slice(0, -cyWithExt.length)

    return this.getFinalFileName(dir, name, cyWithExt, path.join(dir, `${name}${cyWithExt}`))
  }

  private async getFinalFileName (dir: string, name: string, cyWithExt: string, fileToTry: string) {
    // At this point, for a filePath of `/foo/bar/baz.cy.js`
    // - name = `baz`
    // - cyWithExt = `.cy.js`
    let finalFileName = fileToTry

    let i = 0

    while (await this.fileExists(finalFileName)) {
      finalFileName = path.join(
        dir,
        `${name}-copy-${++i}${cyWithExt}`,
      )
    }

    return path.parse(finalFileName).base
  }

  private async fileExists (absolute: string) {
    try {
      await fs.access(absolute, fs.constants.F_OK)

      return true
    } catch (e) {
      return false
    }
  }
}
