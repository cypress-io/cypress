import path from 'path'

let fs: typeof import('fs-extra')

type FoldersWithDist = 'static' | 'runner' | 'runner-ct' | 'driver'

export const getPathToDist = (folder: FoldersWithDist, ...args: string[]) => {
  return path.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

export const getRunnerInjectionContents = () => {
  fs ??= require('fs-extra') as typeof import('fs-extra')

  return fs.readFile(getPathToDist('runner', 'injection.js'))
}

export const getPathToIndex = (pkg: 'runner' | 'runner-ct') => {
  return getPathToDist(pkg, 'index.html')
}

export const getPathToDesktopIndex = (pkg: 'desktop-gui' | 'launchpad') => {
  if (pkg === 'launchpad') return `http://localhost:3001`

  return `file://${path.join(__dirname, '..', '..', pkg, 'dist', 'index.html')}`
}
