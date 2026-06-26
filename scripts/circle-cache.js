const path = require('path')
const crypto = require('crypto')
const fs = require('fs')

const rootPackageJson = require('../package.json')

const opts = parseArgs(process.argv)

async function circleCache () {
  switch (opts.action) {
    case 'prepare': return await prepareCircleCache()
    case 'unpack': return await unpackCircleCache()
    case 'cacheKey': return await cacheKey()
    default: {
      throw new Error('Expected --action "prepare", "unpack", or "cacheKey"')
    }
  }
}

function parseArgs (argv) {
  const args = argv.slice(2)
  const result = {}

  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) {
      continue
    }

    const key = args[i].slice(2)
    const next = args[i + 1]

    if (next && !next.startsWith('--')) {
      result[key] = next
      i++
    } else {
      result[key] = true
    }
  }

  return result
}

// On Windows, both the forward slash (/) and backward slash (\) are accepted as path segment separators
// using forward slashes to match the returned globbed file path separators
const BASE_DIR = path.join(__dirname, '..').replaceAll(/\\/g, '/')
const CACHE_DIR = `${BASE_DIR}/globbed_node_modules`
const p = (str) => `${BASE_DIR}/${str}`

const workspacePaths = rootPackageJson.workspaces.packages
const packageGlobs = workspacePaths.filter((s) => s.endsWith('/*'))

function stableStringify (value) {
  if (value === undefined) {
    return undefined
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const keys = Object.keys(value).sort().filter((key) => value[key] !== undefined)

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

function expandWorkspaceGlob (globPattern) {
  if (!globPattern.endsWith('/*')) {
    return [globPattern]
  }

  const base = globPattern.slice(0, -2)
  const absBase = path.join(BASE_DIR, base)

  if (!fs.existsSync(absBase)) {
    return []
  }

  return fs.readdirSync(absBase, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${base}/${entry.name}`)
}

function collectPackageJsonPaths () {
  const packageJsonPaths = new Set([p('package.json')])

  for (const workspacePath of workspacePaths) {
    if (workspacePath.endsWith('/*')) {
      for (const subPath of expandWorkspaceGlob(workspacePath)) {
        packageJsonPaths.add(p(`${subPath}/package.json`))
      }
    } else {
      packageJsonPaths.add(p(`${workspacePath}/package.json`))
    }
  }

  return [...packageJsonPaths].filter((filePath) => fs.existsSync(filePath)).sort()
}

function walkFiles (dir, shouldInclude) {
  const results = []

  if (!fs.existsSync(dir)) {
    return results
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue
      }

      results.push(...walkFiles(fullPath, shouldInclude))
    } else if (shouldInclude(fullPath)) {
      results.push(fullPath.replaceAll(/\\/g, '/'))
    }
  }

  return results
}

function collectPatchFiles () {
  return walkFiles(BASE_DIR, (filePath) => {
    return filePath.endsWith('.patch')
      && !filePath.includes('/node_modules/')
      && !filePath.includes('_node_modules')
      && !filePath.includes('/dist-app/')
      && !filePath.includes('/dist-launchpad/')
  }).sort()
}

function collectWorkspaceNodeModulePaths () {
  if (packageGlobs.length === 0) {
    return []
  }

  const nodeModulePaths = []

  for (const packageGlob of packageGlobs) {
    for (const subPath of expandWorkspaceGlob(packageGlob)) {
      const nodeModulesPath = p(`${subPath}/node_modules/`)

      if (fs.existsSync(nodeModulesPath)) {
        nodeModulePaths.push(nodeModulesPath)
      }
    }
  }

  return nodeModulePaths.sort()
}

function globGlobbedNodeModules () {
  if (!fs.existsSync(CACHE_DIR)) {
    return []
  }

  const results = []

  for (const workspaceEntry of fs.readdirSync(CACHE_DIR, { withFileTypes: true })) {
    if (!workspaceEntry.isDirectory()) {
      continue
    }

    const workspaceDir = path.join(CACHE_DIR, workspaceEntry.name)

    for (const packageEntry of fs.readdirSync(workspaceDir, { withFileTypes: true })) {
      if (packageEntry.isDirectory()) {
        results.push(`${path.join(workspaceDir, packageEntry.name)}/`.replaceAll(/\\/g, '/'))
      }
    }
  }

  return results
}

async function removePath (target) {
  await fs.promises.rm(target, { force: true, recursive: true })
}

async function movePath (src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  await removePath(dest)

  try {
    await fs.promises.rename(src, dest)
  } catch (err) {
    if (err.code !== 'EXDEV') {
      throw err
    }

    await fs.promises.cp(src, dest, { recursive: true })
    await removePath(src)
  }
}

// Gets the sha of all of the patch-package files we have, so we can use this in the cache key.
// Otherwise, adding/editing a patch will not invalidate the CI cache we have for the yarn install
async function cacheKey () {
  const yarnLocks = [p('yarn.lock')]
  const patchFiles = collectPatchFiles()
  const packageJsons = collectPackageJsonPaths()

  // Concat the stable stringify of all of the package.json dependencies that make up
  const hashedPackageDeps = packageJsons.map((abs) => require(abs)).map(
    ({ name, dependencies, devDependencies, peerDependencies }) => {
      return hashString(
        stableStringify({ name, dependencies, devDependencies, peerDependencies }),
      )
    },
  ).join('')

  const filesToHash = yarnLocks.concat(patchFiles).sort()
  const hashedFiles = await Promise.all(filesToHash.map((filePath) => hashFile(filePath)))
  const cacheKeySource = hashedFiles.concat(hashedPackageDeps)
  const cacheKeyValue = hashString(cacheKeySource.join(''))

  // Log to stdout, used by circle to generate cache key
  console.log(cacheKeyValue)
}

// Need to dynamically unpack and re-assemble all of the node_modules directories
// https://discuss.circleci.com/t/dynamic-or-programmatic-caching-of-directories/1455
async function prepareCircleCache () {
  const paths = collectWorkspaceNodeModulePaths()

  await Promise.all(
    paths.map(async (src) => {
      const dest = src
      .replace(/(.*?)\/node_modules/, '$1_node_modules')
      .replace(BASE_DIR, CACHE_DIR)

      // self-hosted M1 doesn't always clear this directory between runs, so remove it
      await movePath(src, dest)
    }),
  )

  console.log(`Moved globbed node_modules for ${packageGlobs.join(', ')} to ${CACHE_DIR}`)
}

async function unpackCircleCache () {
  const paths = globGlobbedNodeModules()

  if (paths.length === 0) {
    throw new Error('Should have found globbed node_modules to unpack')
  }

  await Promise.all(
    paths.map(async (src) => {
      const dest = src
      .replace(CACHE_DIR, BASE_DIR)
      .replace(/(.*?)_node_modules/, `$1/node_modules`)

      // self-hosted M1 doesn't always clear this directory between runs, so remove it
      await movePath(src, dest)
    }),
  )

  console.log(`Unpacked globbed node_modules from ${CACHE_DIR} to ${packageGlobs.join(', ')}`)

  await removePath(CACHE_DIR)
}

function hashFile (filePath) {
  return new Promise(
    (resolve, reject) => {
      const hash = crypto.createHash('sha1')
      const rs = fs.createReadStream(filePath)

      rs.on('error', reject)
      rs.on('data', (chunk) => {
        hash.update(chunk)
      })

      rs.on('end', () => {
        return resolve(hash.digest('hex'))
      })
    },
  )
}

function hashString (s) {
  return crypto
  .createHash('sha1')
  .update(s)
  .digest('hex')
}

circleCache()
.then(() => {
  process.exit(0)
})
.catch((e) => {
  console.error(e)
  process.exit(1)
})
