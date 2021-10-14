import path from 'path'

import type { DataContext } from '..'

export class FileActions {
  constructor (private ctx: DataContext) {}

  async writeFileInProject (relativePath: string, data: any) {
    if (!this.ctx.activeProject) {
      throw new Error(`Cannot write file in project without active project`)
    }

    await this.ctx.fs.writeFile(
      path.join(this.ctx.activeProject?.projectRoot, relativePath),
      data,
    )
  }
}
