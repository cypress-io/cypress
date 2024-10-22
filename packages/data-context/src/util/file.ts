import path from 'path'

export function toPosix (file: string, sep: string = path.sep) {
  return file.split(sep).join(path.posix.sep)
}

/**
 * Converts a POSIX file path to the current operating system's file path format.
 *
 * This function takes a file path string that uses POSIX separators ('/') and
 * replaces them with the current operating system's path separators.
 *
 * @param file The file path to convert.
 * @returns The converted file path with the current OS's path separators.
 */
export function toOS (file: string) {
  return file.split(path.posix.sep).join(path.sep)
}
