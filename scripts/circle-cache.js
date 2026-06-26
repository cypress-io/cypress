const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { globSync } = require('fs')

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

function globPaths (pattern) {
  return globSync(pattern, {
    cwd: BASE_DIR,
  }).map((match) => `${BASE_DIR}/${match}`.replaceAll(/\\/g, '/'))
}

function collectPackageJsonPaths () {
  const pattern = `{.,${workspacePaths.join(',')}}/package.json`

  return globPaths(pattern).sort()
}

function collectPatchFiles () {
  return globPaths('**/*.patch').filter((filePath) => {
    return !filePath.includes('/node_modules/')
      && !filePath.includes('_node_modules')
      && !filePath.includes('/dist-app/')
      && !filePath.includes('/dist-launchpad/')
  }).sort()
}

function collectWorkspaceNodeModulePaths () {
  if (packageGlobs.length === 0) {
    return []
  }

  const pattern = `{${packageGlobs.join(',')}}/node_modules`

  return globPaths(`${pattern}/`).sort()
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
  const paths = globPaths('globbed_node_modules/*/*/')

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
