import path from 'path'
import { readFile } from 'fs/promises'

export const getPathToExtension = (...args: string[]) => {
  args = [__dirname, '..', 'app-dist', 'v2'].concat(args)

  return path.join.apply(path, args)
}

export const getPathToV3Extension = (...args: string[]) => {
  return path.join(...[__dirname, '..', 'app-dist', 'v3', ...args])
}

export const getPathToTheme = () => {
  return path.join(__dirname, '..', 'theme')
}

export const getPathToRoot = () => {
  return path.join(__dirname, '..')
}

export const setHostAndPath = async (host: string, path: string) => {
  const src = getPathToExtension('background.js')

  const str = await readFile(src, 'utf8')

  return str
  .replace('CHANGE_ME_HOST', host)
  .replace('CHANGE_ME_PATH', path)
}
