import type { DataContext } from '..'

export class EditorDataSource {
  constructor (private ctx: DataContext) {}

  async getEditors (): Promise<any> {
    return this.ctx._apis.editorApi.getAllEditors()
  }
}
