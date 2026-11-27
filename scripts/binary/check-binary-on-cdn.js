// Runs before anything is built, so this must not require workspace packages
require('../../packages/ts/register')

const crypto = require('crypto')
const fs = require('fs-extra')
const minimist = require('minimist')
const path = require('path')
const { Readable } = require('stream')
const { pipeline } = require('stream/promises')
const { uploadArtifactToS3 } = require('./upload-build-artifact')
const uploadUtils = require('./util/upload')

// The binary and npm package are uploaded one after the other, so a run that
// stopped between the two uploads leaves only the binary: reuse needs both.
const artifacts = [
  { type: 'binary', file: 'cypress.zip' },
  { type: 'npm-package', file: 'cypress.tgz' },
]

const getChecksum = async (url) => {
  let res

  try {
    res = await fetch(url, { method: 'HEAD' })
  } catch (err) {
    console.error(`Checking ${url} failed, so the binary will be built`, err)

    return
  }

  if (!res.ok) {
    return
  }

  return res.headers.get('x-amz-meta-checksum') || undefined
}

const download = async ({ url, checksum, destination }) => {
  const res = await fetch(url)

  if (!res.ok || !res.body) {
    throw new Error(`Downloading ${url} failed with HTTP ${res.status}`)
  }

  const hash = crypto.createHash('sha512')
  const body = Readable.fromWeb(res.body)

  body.on('data', (chunk) => hash.update(chunk))
  await pipeline(body, fs.createWriteStream(destination))

  const actual = hash.digest('hex')

  if (actual !== checksum) {
    throw new Error(`${url} downloaded with SHA-512 ${actual}, but its upload recorded ${checksum}`)
  }
}

// When an earlier pipeline for this commit already uploaded its binary and npm
// package, downloads both into `--out` with the `*-url.json` files
// upload-build-artifacts writes, so the jobs that test them get the same files a
// fresh build would have given them.
// Always writes `binary-reuse.json` into `--out`, so the directory can be
// persisted to the workspace whether or not anything was reused.
const checkIfBinaryExistsOnCdn = async (args = process.argv) => {
  console.log('#checkIfBinaryExistsOnCdn')

  const { version, out } = minimist(args, { string: ['version', 'out'] })

  if (!out) {
    throw new Error('Pass --out <directory> to receive the reused artifacts')
  }

  await fs.ensureDir(out)

  const found = await Promise.all(artifacts.map(async ({ type, file }) => {
    const url = await uploadArtifactToS3(['--type', type, '--version', version, '--file', file, '--dry-run', 'true'])
    const checksum = await getChecksum(url)

    console.log(`${url} ${checksum ? 'exists' : 'does not exist'}`)

    return { type, file, url, checksum }
  }))

  let reused = found.every(({ checksum }) => checksum)

  if (reused) {
    console.log('This commit already has a binary and npm package on the CDN. Downloading them instead of building...')

    try {
      for (const { type, file, url, checksum } of found) {
        await download({ url, checksum, destination: path.join(out, file) })
        await uploadUtils.saveUrl(path.join(out, `${type}-url.json`))(url)
      }
    } catch (err) {
      // A failed download costs a rebuild rather than failing every binary job
      console.error(err)
      console.log('Building the binary, since downloading it from the CDN failed.')
      await fs.emptyDir(out)
      reused = false
    }
  } else {
    console.log('Building the binary, since the CDN does not have both artifacts for this commit.')
  }

  await fs.writeJson(path.join(out, 'binary-reuse.json'), { reused })

  return reused
}

module.exports = { checkIfBinaryExistsOnCdn }

if (!module.parent) {
  checkIfBinaryExistsOnCdn().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
