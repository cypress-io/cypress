interface CrossOriginCallbackStoreFile {
  inputFileName: string
  outputFilePath: string
  source: string
}

export class CrossOriginCallbackStore {
  files: { [key: string]: CrossOriginCallbackStoreFile[] } = {}

  addFile (sourceFilePath: string, file: CrossOriginCallbackStoreFile) {
    this.files[sourceFilePath] = (this.files[sourceFilePath] || []).concat(file)
  }

  hasFilesFor (sourceFilePath: string) {
    return !!this.files[sourceFilePath]?.length
  }

  reset (sourceFilePath: string) {
    this.files[sourceFilePath] = []
  }
}

export const crossOriginCallbackStore = new CrossOriginCallbackStore()
