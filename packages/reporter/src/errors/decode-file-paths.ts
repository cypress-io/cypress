import { FileDetails } from '@packages/ui-components'

export function decodeFilePaths (fileDetails: FileDetails) {
  const { absoluteFile, originalFile, relativeFile } = fileDetails

  return {
    ...fileDetails,
    absoluteFile: absoluteFile ? absoluteFile.replace(/%20/g, ' ') : absoluteFile,
    originalFile: originalFile ? originalFile.replace(/%20/g, ' ') : originalFile,
    relativeFile: relativeFile ? relativeFile.replace(/%20/g, ' ') : relativeFile,
  }
}
