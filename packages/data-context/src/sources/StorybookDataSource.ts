import type { SpecFileWithExtension, StorybookInfo } from '@packages/types'
import assert from 'assert'
import * as path from 'path'
import type { DataContext } from '..'

const STORYBOOK_FILES = [
  'main.js',
  'preview.js',
  'preview-head.html',
  'preview-body.html',
]

export class StorybookDataSource {
  constructor (private ctx: DataContext) {}

  async loadStorybookInfo () {
    assert(this.ctx.currentProject)

    return this.storybookInfoLoader.load(this.ctx.currentProject)
  }

  async getStories (): Promise<SpecFileWithExtension[]> {
    const { currentProject } = this.ctx

    assert(currentProject)

    const storybook = await this.ctx.storybook.loadStorybookInfo()

    if (!storybook) {
      return []
    }

    const config = await this.ctx.lifecycleManager.getFullInitialConfig()
    const normalizedGlobs = storybook.storyGlobs.map((glob) => path.join(storybook.storybookRoot, glob))
    const files = await this.ctx.file.getFilesByGlob(currentProject, normalizedGlobs)

    // Don't currently support mdx
    return files.reduce((acc, file) => {
      if (file.endsWith('.mdx')) {
        return acc
      }

      const spec = this.ctx.file.normalizeFileToFileParts({
        absolute: file,
        projectRoot: currentProject,
        searchFolder: config.componentFolder || currentProject,
      })

      return [...acc, spec]
    }, [] as SpecFileWithExtension[])
  }

  private storybookInfoLoader = this.ctx.loader<string, StorybookInfo | null>((projectRoots) => this.batchStorybookInfo(projectRoots))

  private batchStorybookInfo (projectRoots: readonly string[]) {
    return Promise.all(projectRoots.map((projectRoot) => this.detectStorybook(projectRoot)))
  }

  private async detectStorybook (projectRoot: string): Promise<StorybookInfo | null> {
    const storybookRoot = path.join(projectRoot, '.storybook')
    const storybookInfo: StorybookInfo = {
      storybookRoot,
      files: [],
      storyGlobs: [],
    }

    try {
      await this.ctx.fs.access(storybookRoot, this.ctx.fs.constants.F_OK)
    } catch {
      return null
    }

    for (const fileName of STORYBOOK_FILES) {
      try {
        const absolute = path.join(storybookRoot, fileName)
        const file = {
          name: fileName,
          relative: path.relative(projectRoot, absolute),
          absolute,
          content: await this.ctx.fs.readFile(absolute, 'utf-8'),
        }

        storybookInfo.files.push(file)
      } catch (e) {
        // eslint-disable-line no-empty
      }
    }

    const mainJs = storybookInfo.files.find(({ name }) => name === 'main.js')

    if (mainJs) {
      try {
        // Does this need to be wrapped in IPC?
        const mainJsModule = require(mainJs.absolute)

        storybookInfo.storyGlobs = mainJsModule.stories
      } catch (e) {
        return null
      }
    } else {
      return null
    }

    return storybookInfo
  }
}
