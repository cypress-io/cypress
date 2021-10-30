import path from 'path'

import type { DataContext } from '..'

export class FileActions {
  protected createdFiles: string[]
  constructor (private ctx: DataContext) {
    this.createdFiles = []
  }

  // Useful, if there's an error and the file needs to be deleted to be a valid test
  // this method would cleanup those created files for the retry
  async cleanupCreatedFilesInProject () {
    if (!this.ctx.activeProject) {
      return
    }

    await Promise.all(this.createdFiles.map((f) => this.ctx.fs.remove(f)))
  }

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.activeProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    const filePath = path.join(this.ctx.activeProject?.projectRoot, relativePath)

    await this.ctx.fs.writeFile(
      filePath,
      data,
    )

    this.createdFiles.push(filePath)
  }

  async removeFileInProject (relativePath: string) {
    if (!this.ctx.activeProject) {
      throw new Error(`Cannot remove file in project without active project`)
    }

    await this.ctx.fs.remove(path.join(this.ctx.activeProject?.projectRoot, relativePath))
  }
}
