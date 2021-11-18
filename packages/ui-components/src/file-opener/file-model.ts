import { ReactNode } from 'react'

export interface FileDetails {
  absoluteFile?: string
  column: number
  displayFile?: ReactNode
  line: number
  originalFile: string
  relativeFile: string
}

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
