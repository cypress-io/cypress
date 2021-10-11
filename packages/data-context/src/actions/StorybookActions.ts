import type { FoundSpec, FullConfig } from '@packages/types'
import { CsfFile, readCsfOrMdx } from '@storybook/csf-tools'
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

    const spec = await this.generate(storyPath, project.projectRoot, config.componentFolder)

    this.ctx.wizardData.generatedSpec = spec
  }

  private async generate (
    storyPath: string,
    projectRoot: string,
    componentFolder: FullConfig['componentFolder'],
  ): Promise<FoundSpec | null> {
    const storyFile = path.parse(storyPath)
    const storyName = storyFile.name.split('.')[0]

    try {
      const raw = await readCsfOrMdx(storyPath, {
        defaultTitle: storyName || '',
      })
      const parsed = raw.parse()

      if (
        (!parsed.meta.title && !parsed.meta.component) ||
        !parsed.stories.length
      ) {
        return null
      }

      const specFileExtension = '.cy-spec'
      const newSpecContent = this.generateSpecFromCsf(parsed, storyFile)
      const newSpecPath = path.join(
        storyPath,
        '..',
        `${parsed.meta.component}${specFileExtension}${storyFile.ext}`,
      )

      // If this passes then the file exists and we don't want to overwrite it
      try {
        await this.ctx.fs.access(newSpecPath, this.ctx.fs.constants.F_OK)

        return null
      } catch (e) {
        // eslint-disable-line no-empty
      }

      await this.ctx.fs.outputFileSync(newSpecPath, newSpecContent)

      const parsedSpec = path.parse(newSpecPath)

      // Can this be obtained from the spec watcher?
      return {
        baseName: parsedSpec.base,
        fileName: parsedSpec.base.replace(specFileExtension, ''),
        specFileExtension,
        fileExtension: parsedSpec.ext,
        name: path.relative(componentFolder || projectRoot, newSpecPath),
        relative: path.relative(projectRoot, newSpecPath),
        absolute: newSpecPath,
        specType: 'component',
      }
    } catch (e) {
      return null
    }
  }

  private generateSpecFromCsf (parsed: CsfFile, storyFile: path.ParsedPath) {
    const isReact = parsed._ast.program.body.some(
      (statement) => {
        return statement.type === 'ImportDeclaration' &&
        statement.source.value === 'react'
      },
    )
    const isVue = parsed._ast.program.body.some(
      (statement) => {
        return statement.type === 'ImportDeclaration' &&
        statement.source.value.endsWith('.vue')
      },
    )

    if (!isReact && !isVue) {
      throw new Error('Provided story is not supported')
    }

    const getDependency = () => {
      return endent`
      import { mount } from "@cypress/${isReact ? 'react' : 'vue'}"
      import { composeStories } from "@storybook/testing-${isReact ? 'react' : 'vue3'}"`
    }
    const getMountSyntax = (component: string) => {
      return isReact ? `<${component} />` : `${component}()`
    }
    const itContent = parsed.stories
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
      import * as stories from "./${storyFile.name}"
      ${getDependency()}
  
      const composedStories = composeStories(stories)
  
      describe('${parsed.meta.title || parsed.meta.component}', () => {
        ${itContent}
      })`
  }
}
