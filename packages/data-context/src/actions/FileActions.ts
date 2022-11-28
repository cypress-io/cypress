import path from 'path'

// @ts-ignore - no types available
import launchEditor from 'launch-editor'
import type { DataContext } from '..'
import assert from 'assert'

export class FileActions {
  constructor (private ctx: DataContext) {}

  async readFileInProject (relativePath: string): Promise<string> {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.currentProject, relativePath)

    await this.ctx.fs.ensureDir(path.dirname(filePath))

    return this.ctx.fs.readFile(filePath, 'utf-8')
  }

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.currentProject, relativePath)

    await this.ctx.fs.ensureDir(path.dirname(filePath))

    // Typically used in e2e tests, simpler than forcing async
    await this.ctx.fs.writeFile(
      filePath,
      data,
    )
  }

  async removeFileInProject (relativePath: string) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    // Typically used in e2e tests, simpler than forcing async
    await this.ctx.fs.remove(path.join(this.ctx.currentProject, relativePath))
  }

  async moveFileInProject (relativePath: string, toRelativePath: string) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    // Typically used in e2e tests, simpler than forcing async
    await this.ctx.fs.move(
      path.join(this.ctx.currentProject, relativePath),
      path.join(this.ctx.currentProject, toRelativePath),
    )
  }

  openFile (filePath: string, line: number = 1, column: number = 1) {
    assert(this.ctx.currentProject)
    const binary = this.ctx.coreData.localSettings.preferences.preferredEditorBinary

    const absolute = path.resolve(this.ctx.currentProject, filePath)

    if (!binary || !absolute) {
      this.ctx.debug('cannot open file without binary')

      return
    }

    if (binary === 'computer') {
      try {
        this.ctx.actions.electron.showItemInFolder(absolute)
      } catch (err) {
        this.ctx.debug('error opening file: %s', (err as Error).stack)
      }

      return
    }

    launchEditor(`${absolute}:${line}:${column}`, `"${binary}"`, (__: unknown, errMsg: string) => {
      this.ctx.debug('error opening file: %s', errMsg)
    })
  }
}
