import assert from 'assert'
import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import { camelCase, capitalize } from 'lodash'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'
import type { CodeGenFramework } from '@packages/scaffold-config'

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

type ComponentExtension = '.js' | '.ts' | '.jsx' | '.tsx'
export class SpecOptions {
  private parsedPath: ParsedPath;
  private projectRoot: string;
  private parsedErroredCodegenCandidate?: ParsedPath

  private getFrontendFramework () {
    return this.ctx.project.frameworkLoader.load(this.projectRoot)
  }

  constructor (private ctx: DataContext, private options: CodeGenOptions) {
    assert(this.ctx.currentProject)
    this.parsedPath = this.ctx.path.parse(options.codeGenPath)

    if (options.erroredCodegenCandidate) {
      this.parsedErroredCodegenCandidate = this.ctx.path.parse(options.erroredCodegenCandidate)
    }

    // Should always be defined
    this.projectRoot = this.ctx.currentProject
  }

  async getCodeGenOptions () {
    if (this.options.codeGenType === 'component') {
      return this.getComponentCodeGenOptions()
    }

    // console.log('RETURNING DEFAULT OPTIONS')

    return {
      codeGenType: this.options.codeGenType,
      fileName: await this.getFilename(),
    }
  }

  private async getComponentCodeGenOptions () {
    const frontendFramework = await this.getFrontendFramework()

    // console.log({ frontendFramework })

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const framework = frontendFramework.codeGenFramework

    if (framework !== 'vue') {
      return {
        codeGenType: this.options.codeGenType,
        fileName: await this.getFilename(),
      }
    }

    const frameworkOptions = await this.getFrameworkComponentOptions(framework)

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

  private async getFrameworkComponentOptions (framework: CodeGenFramework) {
    const componentName = capitalize(camelCase(this.parsedErroredCodegenCandidate?.name ?? this.parsedPath.name))

    const componentPath = this.relativePath()

    const frameworkOptions = {
      // react: {
      //   imports: ['import React from "react"', 'import { mount } from "@cypress/react"', `import ${componentName} from "${componentPath}"`],
      //   componentName,
      //   docsLink: '// see: https://on.cypress.io/component-testing',
      //   mount: `mount(<${componentName} />)`,
      //   fileName: await this.getFilename(),
      // },
      vue: {
        imports: ['import { mount } from "@cypress/vue"', `import ${componentName} from "${componentPath}"`],
        componentName,
        docsLink: '// see: https://vue-test-utils.vuejs.org/',
        mount: `mount(${componentName}, { props: {} })`,
        fileName: await this.getFilename(await this.getVueExtension()),
      },
    } as const

    return frameworkOptions[framework]
  }

  private async getVueExtension (): Promise<ComponentExtension> {
    try {
      const fileContent = await this.ctx.fs
      .readFile(this.options.codeGenPath)
      .then((res) => res.toString())

      return fileContent.includes('lang="ts"') ? '.cy.ts' : '.cy.js'
    } catch (e) {
      const validExtensions = ['cy.js', '.jsx', '.ts', '.tsx']
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

  private async getFilename (overrideExt?: string) {
    // console.log('OVERRIDE EXT', overrideExt)
    const { dir, base, ext } = this.parsedPath
    let cyWithExt
    let name

    if (overrideExt) {
      cyWithExt = this.getSpecExtension() + overrideExt
      name = base.slice(0, -ext.length)
    } else {
      cyWithExt = this.getSpecExtension() + ext
      name = base.slice(0, -cyWithExt.length)
    }

    // At this point, for a filePath of `/foo/bar/baz.cy.js`
    // - name = `baz`
    // - cyWithExt = `.cy.js`
    let fileToTry = this.ctx.path.join(dir, `${name}${cyWithExt}`)

    // console.log({ name, dir, base, ext, cyWithExt, fileToTry })

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
