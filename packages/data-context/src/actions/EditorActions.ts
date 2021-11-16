import type { DataContext } from '..'
import type { Editor, EditorsResult } from '@packages/types'

export interface EditorApiShape {
  getAllEditors (): Promise<EditorsResult>
  setPreferredEditor (editor: Editor): Promise<void>
}

export class EditorActions {
  constructor (private ctx: DataContext) { }

  getAllEditors () {
    return this.ctx.editorApi.getAllEditors()
  }

  async setPreferredEditor (editor: Editor) {
    return this.ctx.editorApi.setPreferredEditor(editor)
  }
}
