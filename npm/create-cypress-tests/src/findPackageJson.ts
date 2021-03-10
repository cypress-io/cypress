import path from 'path'
import fs from 'fs'
import findUp from 'find-up'

type PackageJsonLike = {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  [key: string]: unknown
}

type FindPackageJsonResult =
  | {
      packageData: PackageJsonLike
      filename: string
      done: false
    }
  | {
      packageData: undefined
      filename: undefined
      done: true
    }

/**
 * Return the parsed package.json that we find in a parent folder.
 *
 * @returns {Object} Value, filename and indication if the iteration is done.
 */
export function createFindPackageJsonIterator (rootPath = process.cwd()) {
  function scanForPackageJson (cwd: string): FindPackageJsonResult {
    const packageJsonPath = findUp.sync('package.json', { cwd })

    if (!packageJsonPath) {
      return {
        packageData: undefined,
        filename: undefined,
        done: true,
      }
    }

    const packageData = JSON.parse(
      fs.readFileSync(packageJsonPath, {
        encoding: 'utf-8',
      }),
    )

    return {
      packageData,
      filename: packageJsonPath,
      done: false,
    }
  }

  return {
    map: <TPayload>(
      cb: (
        data: PackageJsonLike,
        packageJsonPath: string,
      ) => { success: boolean, payload?: TPayload },
    ) => {
      let stepPathToScan = rootPath

      // eslint-disable-next-line
      while (true) {
        const result = scanForPackageJson(stepPathToScan)

        if (result.done) {
          // didn't find the package.json
          return { success: false }
        }

        if (result.packageData) {
          const cbResult = cb(result.packageData, result.filename)

          if (cbResult.success) {
            return { success: true, payload: cbResult.payload }
          }
        }

        const nextStepPathToScan = path.resolve(stepPathToScan, '..')

        if (nextStepPathToScan === stepPathToScan) {
          // we are at the root. Give up
          return { success: false }
        }

        stepPathToScan = nextStepPathToScan
      }
    },
  }
}

export function scanFSForAvailableDependency (cwd: string, deps: string[]) {
  const { success } = createFindPackageJsonIterator(cwd)
  .map(({ dependencies, devDependencies }, path) => {
    if (!dependencies && !devDependencies) {
      return { success: false }
    }

    return {
      success: Object.keys({ ...dependencies, ...devDependencies })
      .some((dependency) => deps.includes(dependency)),
    }
  })

  return success
}

export type PackageJsonIterator = ReturnType<typeof createFindPackageJsonIterator>
