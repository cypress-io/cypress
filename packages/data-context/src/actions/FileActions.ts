import path from 'path'

// @ts-ignore - no types available
import launchEditor from 'launch-editor'
import type { DataContext } from '..'

export class FileActions {
  constructor (private ctx: DataContext) {}

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.currentProject?.projectRoot, relativePath)

    await this.ctx.fs.writeFile(
      filePath,
      data,
    )
  }

  async removeFileInProject (relativePath: string) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    await this.ctx.fs.remove(path.join(this.ctx.currentProject?.projectRoot, relativePath))
  }

  async checkIfFileExists (relativePath: string) {
    if (!this.ctx.currentProject) {
      throw new Error(`Cannot check file in project exists without active project`)
    }

    const filePath = path.join(this.ctx.currentProject?.projectRoot, relativePath)

    return await this.ctx.fs.stat(filePath)
  }

  openFile (absolute: string, line: number = 1, column: number = 1) {
    const binary = this.ctx.coreData.localSettings.preferences.preferredEditorBinary

    if (!binary || !absolute) {
      this.ctx.debug('cannot open file without binary')

      return
    }

    if (binary === 'computer') {
      try {
        this.ctx.electronApi.showItemInFolder(absolute)
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
