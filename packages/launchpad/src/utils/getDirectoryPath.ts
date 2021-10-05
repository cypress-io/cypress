type WebkitFile = File & { path: string }
export function getDirectoryPath (files: FileList | null) {
  if (files) {
    const file = files[0] as WebkitFile
    const path = file?.path ?? ''

    return path.substring(0, path.lastIndexOf('/'))
  }

  return ''
}
