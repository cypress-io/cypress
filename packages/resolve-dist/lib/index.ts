import path from 'path'

let fs: typeof import('fs-extra')

export type RunnerPkg = 'app' | 'runner'

type FoldersWithDist = 'static' | 'driver' | RunnerPkg | 'launchpad'

export const resolveFromPackages = (...args: string[]) => {
  return path.join(...[__dirname, '..', '..', ...args])
}

const getRunnerContents = (filename: string) => {
  fs ??= require('fs-extra') as typeof import('fs-extra')

  return fs.readFile(getPathToDist('runner', filename))
}

export const getPathToDist = (folder: FoldersWithDist, ...args: string[]) => {
  return path.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

export const getRunnerInjectionContents = () => {
  return getRunnerContents('injection.js')
}

export const getRunnerCrossOriginInjectionContents = () => {
  return getRunnerContents('injection_cross_origin.js')
}

export const getPathToIndex = (pkg: RunnerPkg) => {
  return getPathToDist(pkg, 'index.html')
}

export const getPathToDesktopIndex = (graphqlPort: number) => {
  return `http://localhost:${graphqlPort}/__launchpad/index.html`
}
