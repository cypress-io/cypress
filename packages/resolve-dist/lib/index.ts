import path from 'path'
import fs from 'fs-extra'

type FoldersWithDist = 'static' | 'driver' | 'app' | 'runner' | 'launchpad'

export const resolveFromPackages = (...args: string[]) => {
  return path.join(...[__dirname, '..', '..', ...args])
}

const getRunnerContents = (filename: string) => {
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

export const getPathToDesktopIndex = (graphqlPort: number) => {
  return `http://localhost:${graphqlPort}/__launchpad/index.html`
}
