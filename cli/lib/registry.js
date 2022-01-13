const path = require('path')
const crypto = require('crypto')

const state = require('./tasks/state')
const fs = require('./fs').promises
const logger = require('./logger')
const util = require('./util')

// cypress -> node_modules -> package dir
const PACKAGE_PATH = path.join(__dirname, '..', '..')
const SIXTY_MINUTES_IN_MILLISECONDS = 3600000

const hashFilename = (filename) => `${crypto.createHash('md5').update(filename).digest('hex')}`

const defaultRegistry = {
  packagePath: PACKAGE_PATH,
  binaries: {},
  unassociatedBinaries: {},
}

const registeredBinaries = async () => {
  // get all files in registry
  const cacheDir = state.getCacheDir()
  const registryDir = path.join(cacheDir, 'registry')

  const registryFiles = await fs.readdir(registryDir).catch((e) => {
    if (e.code === 'ENOENT') {
      return []
    }

    throw e
  })

  return registryFiles.reduce(async (accumulatorPromise, filename) => {
    const acc = await accumulatorPromise //Because the reduce function is async we have to await the accumulator
    let registry
    const registryFilePath = path.join(registryDir, filename)

    try {
      registry = JSON.parse(await fs.readFile(registryFilePath, 'utf8'))
    } catch (e) {
      logger.always(`Failed to parse registry ${registryFilePath}`)
      throw e
    }

    logger.always('registry ', registry)
    logger.always('acc', acc)

    const { binaries, unassociatedBinaries, packagePath } = registry

    const packagePathExists = await fs.access(packagePath).then(() => true).catch(() => false)

    // if the package path no longer exists
    if (!packagePathExists) {
      //remove file
      await fs.unlink(registryFilePath)

      return acc
    }

    // iterate through the binaries and collect unique versions in a set per binary.
    Object.entries(binaries).forEach(([binary, versions]) => {
      if (!acc[binary]) {
        acc[binary] = new Set()
      }

      logger.always('binary ', binary)

      if (versions.length > 0) {
        //Why the special logic? Npm installs can be tricky, a user could conceivably have two (or more) versions of cypress installed in their package json if a dependency has cypress incorrectly listed as a dependency.
        // To counter this we allow a grace period of 60 minutes. If a version of cypress was installed within 60 minutes of the current version, we won't prune it.
        if (binary === 'cypress') {
          const latestCypressInstallDate = new Date(versions[0].installed).valueOf()

          // Using a for loop so we can break out of it.
          for (let index = 0; index < versions.length; index++) {
            const instance = versions[index]
            const installed = new Date(instance.installed).valueOf()

            logger.always('instance', instance)
            logger.always('latestCypressInstallDate', latestCypressInstallDate)
            logger.always('installed', installed)
            logger.always('difference', latestCypressInstallDate - installed)

            // If a previous version was installed in the project within 60 minutes of the current version, do not prune it.
            if (latestCypressInstallDate - installed < SIXTY_MINUTES_IN_MILLISECONDS) {
              acc[binary].add(instance.version)
            } else {
              // if this instance is too old, any subsequent instances are also too old.
              break
            }
          }
        } else {
          acc[binary].add(versions[0].version)
        }
      }
    })

    // iterate through unassociated binaries and add all of them.
    Object.entries(unassociatedBinaries).forEach(([binary, versions]) => {
      if (!acc[binary]) {
        acc[binary] = new Set()
      }

      Object.keys(versions).forEach((version) => acc[binary].add(version))
    })

    return acc
  }, { cypress: new Set([util.pkgVersion()]) })// The current version should always be added to the registered versions.
}

const addUnassociatedBinaryVersion = ({ versions = {}, version }) => {
  if (versions.version) {
    versions.version.installed = new Date().toISOString()

    return versions
  }

  return {
    [version]: {
      installed: new Date().toISOString(),
    },
    ...versions,
  }
}

const addBinaryVersion = ({ versions = [], version }) => {
  // if the first entry is same as the version we're trying to insert, bail.
  if (versions.length > 0 && versions[0].version === version) {
    versions[0].installed = new Date().toISOString()

    return versions
  }

  return [
    {
      version,
      installed: new Date().toISOString(),
    },
    ...versions,
  ]
}

const registerBinary = async ({ name, version, isUnassociated }) => {
  const cacheDir = state.getCacheDir()
  const registryDir = path.join(cacheDir, 'registry')

  try {
    await fs.mkdir(registryDir, { recursive: true })
  } catch (e) {
    logger.always(`Cypress failed to create registry directory with error ${e}`)

    return
  }

  // Hash project path
  const filename = hashFilename(PACKAGE_PATH)

  // retrieve project registry file, it's ok if the file doesn't exist.
  const registryString = await fs.readFile(path.join(registryDir, filename), 'utf8').catch(() => undefined)
  let registry = registryString ? JSON.parse(registryString) : defaultRegistry

  const { unassociatedBinaries = {}, binaries = {} } = registry

  if (isUnassociated) {
    registry.unassociatedBinaries[name] = addUnassociatedBinaryVersion({ versions: unassociatedBinaries[name], version })
  } else {
    registry.binaries[name] = addBinaryVersion({ versions: binaries[name], version })
  }

  // save registry file
  await fs.writeFile(path.join(registryDir, filename), JSON.stringify(registry, null, 2)).catch((e) => {
    logger.always(`Cypress failed to write out registry for ${name} binary.`)
  })
}

module.exports = {
  registeredBinaries,
  registerBinary,
}
