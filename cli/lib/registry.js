const path = require('path')
const crypto = require('crypto')

const state = require('./tasks/state')
const fs = require('./fs').promises
const logger = require('./logger')
const util = require('./util')

// cypress -> node_modules -> package dir
const PACKAGE_PATH = path.join(__dirname, '..', '..')

const hashFilename = (filename) => `${crypto.createHash('md5').update(filename).digest('hex')}`

const registeredBinaries = async () => {
  // get all files in registry
  const cacheDir = state.getCacheDir()
  const registryDir = path.join(cacheDir, 'registry')

  const registryFiles = await fs.readdir(registryDir)

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

    const packagePathExists = await fs.access(registry.packagePath).then(() => true).catch(() => false)

    // if the package path no longer exists
    if (!packagePathExists) {
      //remove file
      await fs.unlink(registryFilePath)

      return acc
    }

    // iterate through the binaries and collect unique versions in a set per binary.
    Object.entries(registry.binaries).forEach(([binary, version]) => {
      if (!acc[binary]) {
        acc[binary] = new Set()
      }

      acc[binary].add(version)
    })

    return acc
  }, { cypress: new Set([util.pkgVersion()]) })// The current version should always be added to the registered versions.
}

const registerBinary = async ({ name, version, orphan }) => {
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
  const registry = registryString ? JSON.parse(registryString) : {
    packagePath: PACKAGE_PATH,
    binaries: {},
  }

  registry.binaries[name] = version

  // save registry file
  await fs.writeFile(path.join(registryDir, filename), JSON.stringify(registry, null, 2)).catch((e) => {
    logger.always(`Cypress failed to write out registry for ${name} binary.`)
  })
}

module.exports = {
  registeredBinaries,
  registerBinary,
}
