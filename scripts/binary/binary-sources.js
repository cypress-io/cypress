const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const esbuild = require('esbuild')

const escapeString = (string) => string.replaceAll(`\``, `\\\``).replaceAll(`$`, `\\$`)

function read (file) {
  const pathToFile = require.resolve(`./${file}`)

  return fs.readFileSync(pathToFile, 'utf8')
}

const getBinaryEntryPointSource = async () => {
  const esbuildResult = await esbuild.build({
    entryPoints: [require.resolve('./binary-entry-point-source.js')],
    bundle: true,
    platform: 'node',
    write: false,
    minify: true,
    treeShaking: true,
  })

  return esbuildResult.outputFiles[0].text
}

const getIntegrityCheckSource = (baseDirectory) => {
  const fileSource = read('binary-integrity-check-source.js')
  const secret = require('crypto').randomBytes(48).toString('hex')

  const mainIndexHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './index.js'), 'utf8')).digest('hex')
  const indexJscHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './packages/server/index.jsc'), 'utf8')).digest('hex')

  return fileSource.split('\n').join(`\n  `)
  .replaceAll('MAIN_INDEX_HASH', mainIndexHash)
  .replaceAll('INDEX_JSC_HASH', indexJscHash)
  .replaceAll('HMAC_SECRET', secret)
  .replaceAll('CRYPTO_CREATE_HMAC_TO_STRING', escapeString(crypto.createHmac.toString()))
  .replaceAll('CRYPTO_HMAC_UPDATE_TO_STRING', escapeString(crypto.Hmac.prototype.update.toString()))
  .replaceAll('CRYPTO_HMAC_DIGEST_TO_STRING', escapeString(crypto.Hmac.prototype.digest.toString()))
}

module.exports = {
  getBinaryEntryPointSource,
  getIntegrityCheckSource,
}
