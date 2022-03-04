import path from 'path'

const dist = [__dirname, '..', 'dist']

function distPath (...args: string[]) {
  return path.join.apply(path, dist.concat([...args]))
}

export const getPathToFavicon = (filename: string) => {
  return distPath('favicon', filename)
}

export const getPathToIcon = (filename: string) => {
  return distPath('icons', filename)
}

export const getPathToLogo = (filename: string) => {
  return distPath('logo', filename)
}
