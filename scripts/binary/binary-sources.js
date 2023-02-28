const fs = require('fs-extra')
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

const getEncryptionFileSource = async (encryptionFilePath) => {
  const fileContents = await fs.readFile(encryptionFilePath, 'utf8')

  if (!fileContents.includes(`test: CY_TEST,`)) {
    throw new Error(`Expected to find test key in cloud encryption file`)
  }

  return fileContents.replace(`test: CY_TEST,`, '').replace(/const CY_TEST = `(.*?)`/, '')
}

const validateEncryptionFile = async (encryptionFilePath) => {
  const afterReplaceEncryption = await fs.readFile(encryptionFilePath, 'utf8')

  if (afterReplaceEncryption.includes('CY_TEST')) {
    throw new Error(`Expected test key to be stripped from cloud encryption file`)
  }
}

const getCloudApiFileSource = async (cloudApiFilePath) => {
  const fileContents = await fs.readFile(cloudApiFilePath, 'utf8')

  if (!fileContents.includes('process.env.CYPRESS_ENV_DEPENDENCIES')) {
    throw new Error(`Expected to find CYPRESS_ENV_DEPENDENCIES in cloud api file`)
  }

  if (process.env.CYPRESS_ENV_DEPENDENCIES) {
    return fileContents.replace('process.env.CYPRESS_ENV_DEPENDENCIES', `'${process.env.CYPRESS_ENV_DEPENDENCIES}'`)
  }

  return fileContents
}

const validateCloudApiFile = async (cloudApiFilePath) => {
  if (process.env.CYPRESS_ENV_DEPENDENCIES) {
    const afterReplaceCloudApi = await fs.readFile(cloudApiFilePath, 'utf8')

    if (afterReplaceCloudApi.includes('process.env.CYPRESS_ENV_DEPENDENCIES')) {
      throw new Error(`Expected process.env.CYPRESS_ENV_DEPENDENCIES to be stripped from cloud api file`)
    }
  }
}

module.exports = {
  getBinaryEntryPointSource,
  getIntegrityCheckSource,
  getEncryptionFileSource,
  getCloudApiFileSource,
  validateCloudApiFile,
  validateEncryptionFile,
}
