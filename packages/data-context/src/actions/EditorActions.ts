import type { DataContext } from '..'
import type { EditorsResult } from '@packages/types'

export interface EditorApiShape {
  getAllEditors (): Promise<EditorsResult>
}

export class EditorActions {
  constructor (private ctx: DataContext) { }

  getAllEditors (url: string) {
    return this.ctx.editorApi.getAllEditors()
  }
}
