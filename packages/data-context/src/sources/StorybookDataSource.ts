import type { StorybookInfo } from '@packages/types'
import assert from 'assert'
import * as path from 'path'
import type { DataContext } from '..'

const STORYBOOK_FILES = [
  'main.js',
  'preview.js',
  'preview-head.html',
  'preview-body.html',
]

export const STORIES_GLOB = '*.stories.*'

export class StorybookDataSource {
  constructor (private ctx: DataContext) {}

  async loadStorybookInfo () {
    assert(this.ctx.currentProject)

    return this.storybookInfoLoader.load(this.ctx.currentProject)
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

    return storybookInfo
  }
}
