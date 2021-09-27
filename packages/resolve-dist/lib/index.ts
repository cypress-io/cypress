import path from 'path'

let fs: typeof import('fs-extra')

export type RunnerPkg = 'runner' | 'runner-ct'

type FoldersWithDist = 'static' | 'driver' | RunnerPkg

export const getPathToDist = (folder: FoldersWithDist, ...args: string[]) => {
  return path.join(...[__dirname, '..', '..', folder, 'dist', ...args])
}

export const getRunnerInjectionContents = () => {
  fs ??= require('fs-extra') as typeof import('fs-extra')

  return fs.readFile(getPathToDist('runner', 'injection.js'))
}

export const getPathToIndex = (pkg: RunnerPkg) => {
  return getPathToDist(pkg, 'index.html')
}

export const getPathToDesktopIndex = (pkg: 'desktop-gui' | 'launchpad') => {
  // TODO: check if there's a better approach to fix here
  if (pkg === 'launchpad' && process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT) {
    return `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT}`
  }

  return `file://${path.join(__dirname, '..', '..', pkg, 'dist', 'index.html')}`
}
