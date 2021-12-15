import path from 'path'

export function toPosix (file: string, sep: string = path.sep) {
  return file.split(sep).join(path.posix.sep)
}
