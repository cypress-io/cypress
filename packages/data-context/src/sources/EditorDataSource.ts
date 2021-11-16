import type { DataContext } from '..'

export class EditorDataSource {
  constructor (private ctx: DataContext) {}

  get availableEditors () {
    return this.ctx.coreData.editor.avaiable?.map(x => {
      return {
        name: x.name,
        binary: x.binary,
        id: x.id,
        isPreferred: x.binary === this.ctx.coreData.editor.preferredBinary ?? false,
      }
    })
  }
}
