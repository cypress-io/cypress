export interface FileDetails {
  absoluteFile: string
  column: number
  line: number
  originalFile: string
  relativeFile: string
}

export interface Editor {
  id: string
  name: string
  openerId: string
  isOther: boolean
}

export interface GetUserEditorResult {
  preferredOpener?: Editor
  availableEditors?: Editor[]
}
