export interface Editor {
  id: string
  name: string
  binary: string
  isOther: boolean
  description?: string
}

export interface GetUserEditorResult {
  preferredOpener?: Editor
  availableEditors?: Editor[]
}
