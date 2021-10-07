import path from 'path'

let fs: typeof import('fs-extra')

export type RunnerPkg = 'app' | 'runner' | 'runner-ct'

type FoldersWithDist = 'static' | 'driver' | RunnerPkg

export const getPathToDist = (folder: FoldersWithDist, ...args: string[]) => {
  let distDir = 'dist'

  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    distDir = 'dist-e2e'
  }

  return path.join(...[__dirname, '..', '..', folder, distDir, ...args])
}

export const getRunnerInjectionContents = () => {
  fs ??= require('fs-extra') as typeof import('fs-extra')

  return fs.readFile(getPathToDist('runner', 'injection.js'))
}

export const getPathToIndex = (pkg: RunnerPkg) => {
  return getPathToDist(pkg, 'index.html')
}

export const getPathToDesktopIndex = (pkg: 'desktop-gui' | 'launchpad') => {
  let distDir = 'dist'

  // For now, if we see that there's a CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT
  // we assume we're running Cypress targeting that (dev server)
  if (pkg === 'launchpad' && process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT) {
    return `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT}`
  }

  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    distDir = 'dist-e2e'
  }

  return `file://${path.join(__dirname, '..', '..', pkg, distDir, 'index.html')}`
}
