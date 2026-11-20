export interface Editor {
  id: string
  binary?: string | null | undefined
  name: string
}

export interface FileDetails {
  absoluteFile: string
  column: number
  displayFile?: any // ReactNode
  line: number
  originalFile: string
  relativeFile: string
}
