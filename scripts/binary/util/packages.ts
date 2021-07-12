import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
// we wrap glob to handle EMFILE error
import Promise from 'bluebird'
import la from 'lazy-ass'
import check from 'check-more-types'
import execa from 'execa'
import R from 'ramda'
import debugLib from 'debug'

import externalUtils, { globby } from './3rd-party'

const debug = debugLib('cypress:binary')

const pathToPackageJson = function (packageFolder) {
  la(check.unemptyString(packageFolder), 'expected package path', packageFolder)

  return path.join(packageFolder, 'package.json')
}

const createCLIExecutable = (command) => {
  return function (args, cwd = undefined, env = {}) {
    const commandToExecute = `${command} ${args.join(' ')}`

    console.log(commandToExecute)
    if (cwd) {
      console.log('in folder:', cwd)
    }

    // la(check.maybe.string(cwd), 'invalid CWD string', cwd)

    return execa(command, args, { stdio: 'inherit', cwd })
    // if everything is ok, resolve with nothing
    .then(R.always(undefined))
    .catch((result) => {
      const msg = `${commandToExecute} failed with exit code: ${result.code}`

      throw new Error(msg)
    })
  }
}

const yarn = createCLIExecutable('yarn')

export const runAllBuild = _.partial(yarn, ['lerna', 'run', 'build-prod', '--ignore', 'cli'])

export const runAllCleanJs = _.partial(yarn, ['lerna', 'run', 'clean-js', '--ignore', 'cli'])

export async function copyAllToDist (distDir: string) {
  await fs.ensureDir(distDir)

  const started = new Date().valueOf()
  const globbed = await externalUtils.globby(['./packages/*', './npm/*'], {
    onlyFiles: false,
  })

  for (const pkg of globbed) {
    // copies the package to dist
    // including the default paths
    // and any specified in package.json files
    const json = await fs.readJSON(pathToPackageJson(pkg))

    // grab all the files that match "files" wildcards
    // but without all negated files ("!src/**/*.spec.js" for example)
    // and default included paths
    // and convert to relative paths
    const pkgFileMasks = [].concat(json.files || []).concat(json.main || [])

    debug('for pkg %s have the following file masks %o', pkg, pkgFileMasks)
    const foundFileRelativeToPackageFolder = await externalUtils.globby(pkgFileMasks, {
      cwd: pkg, // search in the package folder
      absolute: false, // and return relative file paths
      followSymbolicLinks: false, // do not follow symlinks
    })

    console.log(`Copying ${pkg} to ${path.join(distDir, pkg)}`)

    // fs-extra concurrency tests (copyPackage / copyRelativePathToDist)
    // 1/1  41688
    // 1/5  42218
    // 1/10 42566
    // 2/1  45041
    // 2/2  43589
    // 3/3  51399

    // cp -R concurrency tests
    // 1/1 65811
    for (const relativeFile of foundFileRelativeToPackageFolder) {
      const dest = path.join(distDir, pkg, relativeFile)

      await fs.copy(path.join(pkg, relativeFile), dest, { recursive: true })
    }

    try {
      // Strip out dev-dependencies & scripts for everything in /packages so we can yarn install in there
      await fs.writeJson(path.join(distDir, pkg, 'package.json'), _.omit(json, [
        'scripts',
        'devDependencies',
        'lint-staged',
        'engines',
      ]), { spaces: 2 })
    } catch (e) {
      if (!e.message.includes('ENOENT')) {
        throw e
      }
    }
  }

  console.log('Finished Copying %dms', new Date().valueOf() - started)
}

// replaces local npm version 0.0.0-development
// with the path to the package
// we need to do this instead of just changing the symlink (like we do for require('@packages/...'))
// so the packages actually get installed to node_modules and work with peer dependencies
export const replaceLocalNpmVersions = async function (basePath: string) {
  const visited = new Set<string>()

  const pkgPaths = await globby('./packages/*/package.json', { cwd: basePath })

  async function updatePackageJson (pkg: string) {
    const pkgJsonPath = path.join(basePath, pkg)

    visited.add(pkgJsonPath)
    const json = await fs.readJson(pkgJsonPath)

    const { dependencies } = json

    if (dependencies) {
      let shouldWriteFile = false

      for (const [depName, version] of Object.entries(dependencies)) {
        if (!depName.startsWith('@cypress/') || version !== '0.0.0-development') {
          continue
        }

        const [, localPkg] = depName.split('/')

        const localPkgJsonPath = path.join(basePath, 'npm', localPkg)

        dependencies[`@cypress/${localPkg}`] = `file:${localPkgJsonPath}`
        if (!visited.has(localPkgJsonPath)) {
          await updatePackageJson(`./npm/${localPkg}/package.json`)
        }

        shouldWriteFile = true
      }
      if (shouldWriteFile) {
        await fs.writeJson(pkgJsonPath, json, { spaces: 2 })
      }
    }
  }

  await Promise.all(pkgPaths.map(updatePackageJson))

  return Array.from(visited)
}

export async function removeLocalNpmDirs (distPath: string, except: string[]) {
  const toRemove = await globby(`${distPath}/npm/*`, {
    ignore: except.map((e) => e.replace('/package.json', '')),
    onlyDirectories: true,
  })

  for (const dir of toRemove) {
    await fs.remove(dir)
  }
}
