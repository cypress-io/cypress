import type { DataContext } from '..'
import type { Editor, EditorsResult } from '@packages/types'

export interface EditorApiShape {
  getAllEditors (): Promise<EditorsResult>
  setPreferredEditor (editor: Editor): Promise<void>
}

export class EditorActions {
  constructor (private ctx: DataContext) { }

  async refreshEditors () {
    const { availableEditors, preferredOpener } = await this.ctx.editorApi.getAllEditors()
    this.ctx.coreData.editor.avaiable = availableEditors.map(x => {
      return {
        name: x.name,
        binary: x.binary,
        id: x.id,
        isPreferred: x.binary === preferredOpener?.binary ?? false,
      }
    })
  }

  async setPreferredEditor (editor: Editor) {
    this.ctx.coreData.editor.preferredBinary = editor.binary
    // write to preferences
    return this.ctx.editorApi.setPreferredEditor(editor)
  }
}
