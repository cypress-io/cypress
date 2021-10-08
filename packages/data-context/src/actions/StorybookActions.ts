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

    const spec = await this.generate(storyPath, project.projectRoot)

    this.ctx.wizardData.generatedSpec = spec
  }

  private async generate (
    storyPath: string,
    projectRoot: string,
  ): Promise<Cypress.Cypress['spec'] | null> {
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

      const newSpecContent = this.generateSpecFromCsf(parsed, storyFile)
      const newSpecPath = path.join(
        storyPath,
        '..',
        `${parsed.meta.component}.cy-spec${storyFile.ext}`,
      )

      // If this passes then the file exists and we don't want to overwrite it
      try {
        await this.ctx.fs.access(newSpecPath, this.ctx.fs.constants.F_OK)

        return null
      } catch (e) {
        // eslint-disable-line no-empty
      }

      await this.ctx.fs.outputFileSync(newSpecPath, newSpecContent)

      return {
        name: path.parse(newSpecPath).name,
        relative: path.relative(projectRoot, newSpecPath),
        absolute: newSpecPath,
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
