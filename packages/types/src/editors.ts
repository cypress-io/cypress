export interface Editor {
  id: string
  binary: string
  name: string
}

export interface EditorsResult {
  preferredOpener?: Editor
  availableEditors: Editor[]
}
