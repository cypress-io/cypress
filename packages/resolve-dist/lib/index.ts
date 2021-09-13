import path from 'path'

let fs: typeof import('fs-extra')

export type RunnerPkg = 'runner' | 'runner-ct'

type FoldersWithDist = 'static' | 'driver' | RunnerPkg

const getRunnerContents = (filename) => {
  fs ??= require('fs-extra') as typeof import('fs-extra')

  return fs.readFile(getPathToDist('runner', filename))
}

export const getPathToDist = (folder: FoldersWithDist, ...args: string[]) => {
  return path.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

export const getRunnerInjectionContents = () => {
  return getRunnerContents('injection.js')
}

export const getRunnerMultidomainInjectionContents = () => {
  return getRunnerContents('injection_multidomain.js')
}

export const getPathToIndex = (pkg: RunnerPkg) => {
  return getPathToDist(pkg, 'index.html')
}

export const getPathToDesktopIndex = () => {
  return `file://${path.join(__dirname, '..', '..', 'desktop-gui', 'dist', 'index.html')}`
}
