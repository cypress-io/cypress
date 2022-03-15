import path from 'path'

// @ts-ignore - no types available
import launchEditor from 'launch-editor'
import type { DataContext } from '..'
import assert from 'assert'

export class FileActions {
  constructor (private ctx: DataContext) {}

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.currentProjectRoot) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.currentProjectRoot, relativePath)

    this.ctx.fs.ensureDirSync(path.dirname(filePath))

    // Typically used in e2e tests, simpler than forcing async
    this.ctx.fs.writeFileSync(
      filePath,
      data,
    )
  }

  async removeFileInProject (relativePath: string) {
    if (!this.ctx.currentProjectRoot) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    // Typically used in e2e tests, simpler than forcing async
    this.ctx.fs.removeSync(path.join(this.ctx.currentProjectRoot, relativePath))
  }

  async moveFileInProject (relativePath: string, toRelativePath: string) {
    if (!this.ctx.currentProjectRoot) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    // Typically used in e2e tests, simpler than forcing async
    this.ctx.fs.moveSync(
      path.join(this.ctx.currentProjectRoot, relativePath),
      path.join(this.ctx.currentProjectRoot, toRelativePath),
    )
  }

  async readFileInProject (relative: string) {
    if (!this.ctx.currentProjectRoot) {
      throw new Error(`Cannot check file in project exists without active project`)
    }

    return this.ctx.fs.readFileSync(path.join(this.ctx.currentProjectRoot, relative), 'utf-8')
  }

  async checkIfFileExists (relativePath: string) {
    if (!this.ctx.currentProjectRoot) {
      throw new Error(`Cannot check file in project exists without active project`)
    }

    const filePath = path.join(this.ctx.currentProjectRoot, relativePath)

    try {
      return await this.ctx.fs.stat(filePath)
    } catch {
      return null
    }
  }

  openFile (filePath: string, line: number = 1, column: number = 1) {
    assert(this.ctx.currentProjectRoot)
    const binary = this.ctx.coreData.localSettings.preferences.preferredEditorBinary

    const absolute = path.resolve(this.ctx.currentProjectRoot, filePath)

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
