import _ from 'lodash'
import fs from 'fs-extra'
import util from 'util'
import path from 'path'
import glob from 'glob'
import la from 'lazy-ass'
import check from 'check-more-types'
import execa from 'execa'
import debugLib from 'debug'

const debug = debugLib('cypress:binary')

const globAsync = util.promisify(glob)

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
    .then(() => undefined)
    .catch((result) => {
      const msg = `${commandToExecute} failed with exit code: ${result.code}`

      throw new Error(msg)
    })
  }
}

const yarn = createCLIExecutable('yarn')

export const runAllCleanJs = _.partial(yarn, ['lerna', 'run', 'clean-js', '--ignore', 'cli'])

export async function copyAllToDist (distDir: string) {
  await fs.ensureDir(distDir)

  const started = new Date().valueOf()
  const globbed = await globAsync('./{packages,npm}/*')

  for (const pkg of globbed) {
    // copies the package to dist
    // including the default paths
    // and any specified in package.json files
    let json

    try {
      json = await fs.readJSON(pathToPackageJson(pkg))
    } catch (e) {
      if (e.code === 'ENOENT') {
        continue
      }
    }

    // grab all the files that match "files" wildcards
    // but without all negated files ("!src/**/*.spec.js" for example)
    // and default included paths
    // and convert to relative paths
    const pkgFileMasks = [].concat(json?.files || []).concat(json?.main || [])

    debug('for pkg %s have the following file masks %o', pkg, pkgFileMasks)
    let foundFileRelativeToPackageFolder = []

    if (pkgFileMasks.length > 0) {
      const pattern = pkgFileMasks.length > 1 ? `{${pkgFileMasks.join(',')}}` : pkgFileMasks[0]

      foundFileRelativeToPackageFolder = await globAsync(pattern, {
        cwd: pkg, // search in the package folder
        absolute: false, // and return relative file paths
        follow: false, // do not follow symlinks
      })
    }

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

  const pkgPaths = await globAsync('./packages/*/', { cwd: basePath })

  async function updatePackageJson (pkg: string) {
    const pkgPath = path.join(basePath, pkg)
    const pkgJsonPath = path.join(basePath, pkg, 'package.json')

    visited.add(pkgPath)
    const json = await fs.readJson(pkgJsonPath)

    const { dependencies } = json

    if (dependencies) {
      let shouldWriteFile = false

      for (const [depName, version] of Object.entries(dependencies)) {
        const matchedPkg = Boolean(depName.startsWith('@cypress/'))

        if (!matchedPkg || version !== '0.0.0-development') {
          continue
        }

        const pkgName = depName.startsWith('@cypress/') ? depName.split('/')[1] : depName

        const localPkgPath = path.join(basePath, 'npm', pkgName)

        json.dependencies[depName] = `file:${localPkgPath}`
        shouldWriteFile = true

        if (!visited.has(localPkgPath)) {
          await updatePackageJson(`./npm/${pkgName}`)
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
  const toRemove = await globAsync(`${distPath}/npm/*/`, {
    ignore: except,
  })

  for (const dir of toRemove) {
    await fs.remove(dir)
  }
}
