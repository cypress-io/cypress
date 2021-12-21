import path from 'path'

let fs: typeof import('fs-extra')

export type RunnerPkg = 'app' | 'runner' | 'runner-ct'

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

export const getPathToDesktopIndex = (graphqlPort: number) => {
  // For now, if we see that there's a CYPRESS_INTERNAL_VITE_DEV
  // we assume we're running Cypress targeting that (dev server)
  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    return `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT}?gqlPort=${graphqlPort}`
  }

  return `file://${path.join(__dirname, '..', '..', 'launchpad', 'dist', 'index.html')}?gqlPort=${graphqlPort}`
}
