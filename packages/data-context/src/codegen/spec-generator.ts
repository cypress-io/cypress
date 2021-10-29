import type { DataContext } from '../DataContext'
import type { ParsedPath } from 'path'
import endent from 'endent'
import { camelCase, capitalize } from 'lodash'
import type { CodeGenType } from '@packages/graphql/src/gen/nxs.gen'
import type { CodeGenFramework } from '@packages/types'
import { CsfFile, readCsfOrMdx } from '@storybook/csf-tools'

interface CodeGenOptions {
  codeGenPath: string
  codeGenType: CodeGenType
  specFileExtension: string
}

export class SpecGenerator {
  private parsedPath: ParsedPath;
  private projectRoot: string;

  private getFrontendFramework () {
    return this.ctx.project.frameworkLoader.load(this.projectRoot)
  }

  constructor (private ctx: DataContext, private options: CodeGenOptions) {
    this.parsedPath = this.ctx.path.parse(options.codeGenPath)
    // Should always be defined
    this.projectRoot = this.ctx.currentProject?.projectRoot as string
  }

  async generateSpec () {
    if (this.options.codeGenType === 'component') {
      return this.generateSpecFromComponent()
    }

    if (this.options.codeGenType === 'integration') {
      return this.generateIntegrationSpec()
    }

    return this.generateSpecFromStory()
  }

  // ------------Component Generation---------------
  private async generateSpecFromComponent () {
    const frontendFramework = await this.getFrontendFramework()

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const framework = frontendFramework.codeGenFramework
    const frameworkOptions = await this.getFrameworkComponentOptions(framework)

    const specContent = endent`
      import { mount } from "@cypress/${framework}"
      import ${frameworkOptions.componentName} from "./${frameworkOptions.componentImport}"
      
      describe('<${frameworkOptions.componentName} />', () => {
        it('renders', () => {
          ${frameworkOptions.body}
        })
      })
    `
    const specAbsolute = this.getFilename(frameworkOptions.fileExtension)

    return { specContent, specAbsolute }
  }

  private async getFrameworkComponentOptions (framework: CodeGenFramework) {
    const componentName = capitalize(camelCase(this.parsedPath.name))
    const frameworkOptions = {
      react: {
        componentName,
        componentImport: this.parsedPath.name,
        mountImport: '@cypress/react',
        body: endent`
          see: https://reactjs.org/docs/test-utils.html
          mount(<${componentName} />)
        `,
        fileExtension: this.parsedPath.ext,
      },
      vue: {
        componentName,
        componentImport: this.parsedPath.base,
        mountImport: '@cypress/vue',
        body: endent`
          // see: https://vue-test-utils.vuejs.org/
          mount(${componentName}, { props: {} })
        `,
        fileExtension: await this.getVueExtenstion(),
      },
    } as const

    return frameworkOptions[framework]
  }

  private async getVueExtenstion (): Promise<'.js' | '.ts'> {
    try {
      const fileContent = await this.ctx.fs
      .readFile(this.options.codeGenPath)
      .then((res) => res.toString())

      return fileContent.includes('lang="ts"') ? '.ts' : '.js'
    } catch (e) {
      return '.js'
    }
  }
  // ------------------------------------------------

  // ---------------Story Generation-----------------
  private async generateSpecFromStory () {
    const frontendFramework = await this.getFrontendFramework()

    if (!frontendFramework) {
      throw new Error('Cannot generate a spec without a framework')
    }

    const defaultTitle = this.parsedPath.name.split('.')[0] || ''
    const csf = await readCsfOrMdx(this.options.codeGenPath, {
      defaultTitle,
    }).then((res) => res.parse())

    if ((!csf.meta.title && !csf.meta.component) || !csf.stories.length) {
      throw new Error(`Failed parsing ${this.options.codeGenPath} as CSF`)
    }

    const frameworkOptions = this.getFrameworkStoryOptions(
      frontendFramework.codeGenFramework,
      csf,
    )

    let specContent = endent`
      ${frameworkOptions.imports.join('\n')}

      const composedStories = composeStories(stories)

      describe('${csf.meta.component || csf.meta.title}', () => {
        ${csf.stories
    .map((story) => {
      const storyName = story.name.replace(/\s+/, '')

      return endent`
            it('should render ${storyName}', () => {
              const { ${storyName} } = composedStories
              ${frameworkOptions.mount(storyName)}
            })
          `
    })
    .join('\n\n')}
      })
    `

    // Only want first story to render
    if (csf.stories.length > 1) {
      specContent = specContent.replace('it(', 'it.only(')
    }

    const specAbsolute = this.getFilename(this.parsedPath.ext)

    return { specContent, specAbsolute }
  }

  private getFrameworkStoryOptions (framework: CodeGenFramework, csf: CsfFile) {
    const frameworkOptions = {
      react: {
        imports: [
          'import React from "react"',
          'import { mount } from "@cypress/react"',
          'import { composeStories } from "@storybook/testing-react"',
          `import * as stories from "./${this.parsedPath.name}"`,
        ],
        mount: (StoryName: string) => `mount(<${StoryName} />)`,
      },
      vue: {
        imports: [
          'import { mount } from "@cypress/vue"',
          'import { composeStories } from "@storybook/testing-vue3"',
          `import * as stories from "./${this.parsedPath.name}"`,
        ],
        mount: (StoryName: string) => `mount(${StoryName}())`,
      },
    } as const

    return frameworkOptions[framework]
  }
  // ------------------------------------------------

  // ------------Intergration Generation-------------
  private generateIntegrationSpec () {
    const specContent = endent`
      describe('${this.parsedPath.base}', () => {
        it('should visit', () => {
          cy.visit('/')
        })
      })
    `
    const specAbsolute = this.getFilename(this.parsedPath.ext)

    return { specContent, specAbsolute }
  }
  // ------------------------------------------------

  private getFilename (ext: string) {
    const { base, dir, name } = this.parsedPath
    const cyWithExt = this.options.specFileExtension + ext

    // Integration test comes with specFileExtension already so don't append it
    const fileName =
      this.options.codeGenType === 'integration'
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

    return fileToTry
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
