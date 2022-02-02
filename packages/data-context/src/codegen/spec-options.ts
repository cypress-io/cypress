import assert from 'assert'
import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import { camelCase, capitalize } from 'lodash'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'
import type { CodeGenFramework } from '@packages/types'
import { CsfFile, readCsfOrMdx } from '@storybook/csf-tools'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  specFileExtension: string
  erroredCodegenCandidate?: string | null
}

type PossiblesExtension = '.js' | '.ts' | '.jsx' | '.tsx'

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

  getCodeGenOptions () {
    if (this.options.codeGenType === 'component') {
      return this.getComponentCodeGenOptions()
    }

    if (this.options.codeGenType === 'story') {
      return this.getStoryCodeGenOptions()
    }

    return this.getIntegrationCodeGenOptions()
  }

  private getIntegrationCodeGenOptions () {
    return {
      fileName: this.getFilename(this.parsedPath.ext),
    }
  }

  private async getComponentCodeGenOptions () {
    const frontendFramework = await this.getFrontendFramework()

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const framework = frontendFramework.codeGenFramework
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
      react: {
        imports: ['import React from "react"', 'import { mount } from "@cypress/react"', `import ${componentName} from "${componentPath}"`],
        componentName,
        docsLink: '// see: https://reactjs.org/docs/test-utils.html',
        mount: `mount(<${componentName} />)`,
        fileName: this.getFilename(this.parsedPath.ext),
      },
      vue: {
        imports: ['import { mount } from "@cypress/vue"', `import ${componentName} from "${componentPath}"`],
        componentName,
        docsLink: '// see: https://vue-test-utils.vuejs.org/',
        mount: `mount(${componentName}, { props: {} })`,
        fileName: this.getFilename(await this.getVueExtension()),
      },
    } as const

    return frameworkOptions[framework]
  }

  private async getVueExtension (): Promise<PossiblesExtension> {
    try {
      const fileContent = await this.ctx.fs
      .readFile(this.options.codeGenPath)
      .then((res) => res.toString())

      return fileContent.includes('lang="ts"') ? '.ts' : '.js'
    } catch (e) {
      const validExtensions = ['.js', '.jsx', '.ts', '.tsx']
      const possibleExtension = this.parsedPath.ext

      if (validExtensions.includes(possibleExtension)) {
        return possibleExtension as PossiblesExtension
      }

      return '.js'
    }
  }

  private async getStoryCodeGenOptions () {
    const frontendFramework = await this.getFrontendFramework()

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const defaultTitle = this.parsedPath.name.split('.')[0] || ''

    const csf = await readCsfOrMdx(this.options.erroredCodegenCandidate ?? this.options.codeGenPath, {
      defaultTitle,
    }).then((res) => res.parse())

    if ((!csf.meta.title && !csf.meta.component) || !csf.stories.length) {
      throw new Error(`Failed parsing ${this.options.codeGenPath} as CSF`)
    }

    const frameworkOptions = this.getFrameworkStoryOptions(
      frontendFramework.codeGenFramework,
      csf,
    )

    const options = {
      ...frameworkOptions,
      title: csf.meta.component || csf.meta.title,
    }

    return options
  }

  private getFrameworkStoryOptions (framework: CodeGenFramework, csf: CsfFile) {
    const storyPath = this.relativePath()

    const frameworkOptions = {
      react: {
        imports: [
          'import React from "react"',
          'import { mount } from "@cypress/react"',
          'import { composeStories } from "@storybook/testing-react"',
          `import * as stories from "${storyPath}"`,
        ],
        stories: csf.stories.map((story) => {
          const component = story.name.replace(/\s+/, '')

          return {
            component,
            mount: `mount(<${component} />)`,
          }
        }),
        fileName: this.getFilename(this.parsedPath.ext),
      },
      vue: {
        imports: [
          'import { mount } from "@cypress/vue"',
          'import { composeStories } from "@storybook/testing-vue3"',
          `import * as stories from "${storyPath}"`,
        ],
        stories: csf.stories.map((story) => {
          const component = story.name.replace(/\s+/, '')

          return {
            component,
            mount: `mount(${component}())`,
          }
        }),
        storyName: this.parsedPath.name,
        fileName: this.getFilename(this.parsedPath.ext),
      },
    } as const

    return frameworkOptions[framework]
  }

  private getFilename (ext: string) {
    const { base, dir, name } = this.parsedPath
    const cyWithExt = this.options.specFileExtension + ext

    // Integration test comes with specFileExtension already so don't append it
    const fileName =
      this.options.codeGenType === 'e2e'
        ? base.replace(cyWithExt, '')
        : name

    let fileToTry = this.ctx.path.join(dir, `${fileName}${cyWithExt}`)

    let i = 0

    while (this.fileExists(fileToTry)) {
      fileToTry = this.ctx.path.join(
        dir,
        `${fileName}-copy-${++i}${cyWithExt}`,
      )
    }

    return this.ctx.path.parse(fileToTry).base
  }

  private fileExists (absolute: string) {
    try {
      this.ctx.fs.accessSync(absolute, this.ctx.fs.constants.F_OK)

      return true
    } catch (e) {
      return false
    }
  }
}
