/* eslint-disable no-console */
const globby = require('globby')
const path = require('path')
const fsExtra = require('fs-extra')
const minimist = require('minimist')
const crypto = require('crypto')
const fs = require('fs')
const stringify = require('fast-json-stable-stringify')

const opts = minimist(process.argv.slice(2))

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

const BASE_DIR = path.join(__dirname, '..')
const p = (str) => path.join(BASE_DIR, str)

// Gets the sha of all of the patch-package files we have, so we can use this in the cache key.
// Otherwise, adding/editing a patch will not invalidate the CI cache we have for the yarn install
async function cacheKey () {
  const yarnLocks = [p('yarn.lock')]
  const patchFiles = await globby(p('**/*.patch'), {
    ignore: ['**/node_modules/**', '**/*_node_modules/**'],
  })
  // TODO: base on workspaces or lerna
  const packageJsons = await globby([p('package.json'), p('cli/package.json'), p('{npm,packages}/*/package.json')], {
    ignore: ['**/node_modules/**', '**/*_node_modules/**'],
  })

  // Concat the stable stringify of all of the package.json dependencies that make up
  const hashedPackageDeps = packageJsons.sort().map((abs) => require(abs)).map(
    ({ name, dependencies, devDependencies, peerDependencies }) => hashString(stringify({ name, dependencies, devDependencies, peerDependencies })),
  ).join('')

  const filesToHash = yarnLocks.concat(patchFiles).sort()
  const hashedFiles = await Promise.all(filesToHash.map((p) => hashFile(p)))
  const cacheKeySource = hashedFiles.concat(hashedPackageDeps)
  const cacheKey = hashString(cacheKeySource.join(''))

  // Log to stdout, used by circle to generate cache key
  console.log(cacheKey)
}

// Need to dynamically unpack and re-assemble all of the node_modules directories
// https://discuss.circleci.com/t/dynamic-or-programmatic-caching-of-directories/1455
async function prepareCircleCache () {
  const paths = await globby(
    p(`{packages,npm}/*/node_modules`),
    { onlyDirectories: true },
  )

  await Promise.all(
    paths.map(async (src) => {
      await fsExtra.move(
        src,
        src
        .replace('/packages/', '/packages_node_modules/')
        .replace('/npm/', '/npm_node_modules/'),
      )
    }),
  )
}

async function unpackCircleCache () {
  const paths = await globby(
    p(`{packages,npm}_node_modules/*/node_modules`),
    { onlyDirectories: true },
  )

  await Promise.all(
    paths.map(async (src) => {
      await fsExtra.move(
        src,
        src
        .replace('/packages_node_modules/', '/packages/')
        .replace('/npm_node_modules/', '/npm/'),
      )
    }),
  )

  await fsExtra.remove(p('packages_node_modules'))
  await fsExtra.remove(p('npm_node_modules'))
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
