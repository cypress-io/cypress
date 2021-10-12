import type { FoundSpec, FullConfig } from '@packages/types'
import { readCsfOrMdx } from '@storybook/csf-tools'
import endent from 'endent'
import * as path from 'path'
import type { DataContext } from '..'

export class StorybookActions {
  constructor (private ctx: DataContext) {}

  async generateSpecFromStory (storyPath: string) {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot generate a spec without activeProject.`)
    }

    const config = await this.ctx.project.getConfig(project.projectRoot)

    const spec = await this.generateSpec(
      storyPath,
      project.projectRoot,
      config.componentFolder,
    )

    this.ctx.wizardData.generatedSpec = spec
  }

  private async generateSpec (
    storyPath: string,
    projectRoot: string,
    componentFolder: FullConfig['componentFolder'],
  ): Promise<FoundSpec | null> {
    const specFileExtension = '.cy'
    const parsedFile = path.parse(storyPath)
    const fileName = parsedFile.name.split('.')[0] as string

    let newSpecContent: string | null

    try {
      newSpecContent = await this.generateSpecFromCsf(
        storyPath,
        fileName,
      )

      if (!newSpecContent) {
        return null
      }
    } catch (e) {
      return null
    }

    let newSpecAbsolute = path.join(
      parsedFile.dir,
      `${fileName}${specFileExtension}${parsedFile.ext}`,
    )

    try {
      newSpecAbsolute = await this.getFilename(
        newSpecAbsolute,
        fileName,
        specFileExtension,
      )

      await this.ctx.fs.outputFile(newSpecAbsolute, newSpecContent)
    } catch (e) {
      return null
    }

    const parsedNewSpec = path.parse(newSpecAbsolute)

    // Can this be obtained from the spec watcher?
    return {
      absolute: newSpecAbsolute,
      baseName: parsedNewSpec.base,
      fileExtension: parsedNewSpec.ext,
      fileName,
      name: path.relative(componentFolder || projectRoot, newSpecAbsolute),
      relative: path.relative(projectRoot, newSpecAbsolute),
      specFileExtension,
      specType: 'component',
    }
  }

  private async generateSpecFromCsf (
    absolute: string,
    storyName: string,
  ): Promise<null | string> {
    const csf = await readCsfOrMdx(absolute, {
      defaultTitle: storyName,
    }).then((res) => res.parse())

    if ((!csf.meta.title && !csf.meta.component) || !csf.stories.length) {
      return null
    }

    const isReact = csf._ast.program.body.some((statement) => {
      return (
        statement.type === 'ImportDeclaration' &&
        statement.source.value === 'react'
      )
    })
    const isVue = csf._ast.program.body.some((statement) => {
      return (
        statement.type === 'ImportDeclaration' &&
        statement.source.value.endsWith('.vue')
      )
    })

    if (!isReact && !isVue) {
      throw new Error('Provided story is not supported')
    }

    const getDependency = () => {
      return endent`
      import { mount } from "@cypress/${isReact ? 'react' : 'vue'}"
      import { composeStories } from "@storybook/testing-${
        isReact ? 'react' : 'vue3'
      }"`
    }
    const getMountSyntax = (component: string) => {
      return isReact ? `<${component} />` : `${component}()`
    }
    const itContent = csf.stories
    .map((story, i) => {
      const component = story.name.replace(/\s+/, '')
      let it = endent`
          it('should render ${component}', () => {
            const { ${component} } = composedStories
            mount(${getMountSyntax(component)})
          })`

      if (i !== 0) {
        it = it
        .split('\n')
        .map((line) => `// ${line}`)
        .join('\n')
      }

      return it
    })
    .join('\n\n')

    return endent`${isReact ? `import React from "react"` : ''}
      import * as stories from "./${path.parse(absolute).name}"
      ${getDependency()}
  
      const composedStories = composeStories(stories)
  
      describe('${csf.meta.title || csf.meta.component}', () => {
        ${itContent}
      })`
  }

  private async getFilename (absolute: string, fileName: string, specFileExtension: string) {
    let fileToGenerate = absolute
    const { dir, ext } = path.parse(absolute)
    let i = 0

    while (this.fileExists(fileToGenerate)) {
      fileToGenerate = path.join(
        dir,
        `${fileName}-copy-${++i}${specFileExtension}${ext}`,
      )
    }

    return fileToGenerate
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
