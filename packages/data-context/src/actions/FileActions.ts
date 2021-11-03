import path from 'path'

import type { DataContext } from '..'

export class FileActions {
  constructor (private ctx: DataContext) {}

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.activeProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.activeProject?.projectRoot, relativePath)

    await this.ctx.fs.writeFile(
      filePath,
      data,
    )
  }

  async removeFileInProject (relativePath: string) {
    if (!this.ctx.activeProject) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    await this.ctx.fs.remove(path.join(this.ctx.activeProject?.projectRoot, relativePath))
  }
}
