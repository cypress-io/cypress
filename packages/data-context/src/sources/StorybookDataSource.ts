import type { SpecFile, StorybookInfo } from '@packages/types'
import glob from 'glob'
import * as path from 'path'
import { promisify } from 'util'
import type { DataContext } from '..'

const asyncGlob = promisify(glob)

const STORYBOOK_FILES = [
  'main.js',
  'preview.js',
  'preview-head.html',
  'preview-body.html',
]

export class StorybookDataSource {
  constructor (private ctx: DataContext) {}

  get storybookInfo () {
    if (!this.ctx.activeProject?.projectRoot) {
      return Promise.resolve(null)
    }

    return this.storybookInfoLoader.load(this.ctx.activeProject?.projectRoot)
  }

  async getStories (): Promise<SpecFile[]> {
    const project = this.ctx.activeProject

    if (!project) {
      throw Error(`Cannot find stories without activeProject.`)
    }

    const storybook = await this.ctx.storybook.storybookInfo

    if (!storybook) {
      return []
    }

    const config = await this.ctx.project.getConfig(project.projectRoot)
    const files: string[] = []

    for (const storyPattern of storybook.storyGlobs) {
      const res = await asyncGlob(path.join(storybook.storybookRoot, storyPattern))

      files.push(...res)
    }

    // Don't currently support mdx
    return files
    .filter((file) => !file.endsWith('.mdx'))
    .map((file) => this.ctx.file.normalizeFileToSpec(file, project.projectRoot, config.componentFolder || project.projectRoot))
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
