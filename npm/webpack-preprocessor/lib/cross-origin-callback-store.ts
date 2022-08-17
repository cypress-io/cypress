export interface CrossOriginCallbackStoreFile {
  inputFileName: string
  outputFilePath: string
  source: string
}

export class CrossOriginCallbackStore {
  private files: { [key: string]: CrossOriginCallbackStoreFile[] } = {}

  addFile (sourceFilePath: string, file: CrossOriginCallbackStoreFile) {
    this.files[sourceFilePath] = (this.files[sourceFilePath] || []).concat(file)
  }

  hasFilesFor (sourceFiles: string[]) {
    return !!this.getFilesFor(sourceFiles)?.length
  }

  getFilesFor (sourceFiles: string[]) {
    return Object.keys(this.files).reduce((files, sourceFilePath) => {
      return sourceFiles.includes(sourceFilePath) ? files.concat(this.files[sourceFilePath]) : files
    }, [] as CrossOriginCallbackStoreFile[])
  }

  reset (sourceFilePath: string) {
    this.files[sourceFilePath] = []
  }
}

export const crossOriginCallbackStore = new CrossOriginCallbackStore()
