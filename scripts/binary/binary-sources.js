const fs = require('fs-extra')
const crypto = require('crypto')
const path = require('path')
const esbuild = require('esbuild')

const escapeString = (string) => string.replaceAll(`\``, `\\\``).replaceAll(`$`, `\\$`)
const secret = require('crypto').randomBytes(48).toString('hex')
const DUMMY_INDEX_JSC_HASH = 'abcddcbaabcddcbaabcddcbaabcddcba'

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

const getBinaryByteNodeEntryPointSource = async () => {
  const esbuildResult = await esbuild.build({
    entryPoints: [require.resolve('./binary-byte-node-entry-point-source.js')],
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

  const mainIndexHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './index.js'), 'utf8')).digest('hex')

  return fileSource.split('\n').join(`\n  `)
  .replaceAll('MAIN_INDEX_HASH', mainIndexHash)
  .replaceAll('INDEX_JSC_HASH', DUMMY_INDEX_JSC_HASH)
  .replaceAll('HMAC_SECRET', secret)
  .replaceAll('CRYPTO_CREATE_HMAC_TO_STRING', escapeString(crypto.createHmac.toString()))
  .replaceAll('CRYPTO_HMAC_UPDATE_TO_STRING', escapeString(crypto.Hmac.prototype.update.toString()))
  .replaceAll('CRYPTO_HMAC_DIGEST_TO_STRING', escapeString(crypto.Hmac.prototype.digest.toString()))
}

const getIndexJscHash = (baseDirectory) => {
  return crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './packages/server/index.jsc'), 'utf8')).digest('hex')
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

const getCloudEnvironmentFileSource = async (cloudApiFilePath) => {
  const fileContents = await fs.readFile(cloudApiFilePath, 'utf8')

  if (!fileContents.includes('process.env.CYPRESS_ENV_DEPENDENCIES')) {
    throw new Error(`Expected to find CYPRESS_ENV_DEPENDENCIES in cloud api file`)
  }

  if (process.env.CYPRESS_ENV_DEPENDENCIES) {
    return fileContents.replace('process.env.CYPRESS_ENV_DEPENDENCIES', `'${process.env.CYPRESS_ENV_DEPENDENCIES}'`)
  }

  return fileContents
}

const validateCloudEnvironmentFile = async (cloudApiFilePath) => {
  if (process.env.CYPRESS_ENV_DEPENDENCIES) {
    const afterReplaceCloudApi = await fs.readFile(cloudApiFilePath, 'utf8')

    if (afterReplaceCloudApi.includes('process.env.CYPRESS_ENV_DEPENDENCIES')) {
      throw new Error(`Expected process.env.CYPRESS_ENV_DEPENDENCIES to be stripped from cloud api file`)
    }
  }
}

const getProtocolFileSource = async (protocolFilePath) => {
  const fileContents = await fs.readFile(protocolFilePath, 'utf8')

  if (!fileContents.includes('process.env.CYPRESS_LOCAL_PROTOCOL_PATH')) {
    throw new Error(`Expected to find CYPRESS_LOCAL_PROTOCOL_PATH in protocol file`)
  }

  return fileContents.replaceAll('process.env.CYPRESS_LOCAL_PROTOCOL_PATH', 'undefined')
}

const getStudioFileSource = async (studioFilePath) => {
  const fileContents = await fs.readFile(studioFilePath, 'utf8')

  if (!fileContents.includes('process.env.CYPRESS_LOCAL_STUDIO_PATH')) {
    throw new Error(`Expected to find CYPRESS_LOCAL_STUDIO_PATH in studio file`)
  }

  return fileContents.replaceAll('process.env.CYPRESS_LOCAL_STUDIO_PATH', 'undefined')
}

const validateProtocolFile = async (protocolFilePath) => {
  const afterReplaceProtocol = await fs.readFile(protocolFilePath, 'utf8')

  if (afterReplaceProtocol.includes('process.env.CYPRESS_LOCAL_PROTOCOL_PATH')) {
    throw new Error(`Expected process.env.CYPRESS_LOCAL_PROTOCOL_PATH to be stripped from protocol file`)
  }
}

const validateStudioFile = async (studioFilePath) => {
  const afterReplaceStudio = await fs.readFile(studioFilePath, 'utf8')

  if (afterReplaceStudio.includes('process.env.CYPRESS_LOCAL_STUDIO_PATH')) {
    throw new Error(`Expected process.env.CYPRESS_LOCAL_STUDIO_PATH to be stripped from studio file`)
  }
}

module.exports = {
  getBinaryEntryPointSource,
  getBinaryByteNodeEntryPointSource,
  getIntegrityCheckSource,
  getEncryptionFileSource,
  validateEncryptionFile,
  getCloudEnvironmentFileSource,
  validateCloudEnvironmentFile,
  getProtocolFileSource,
  validateProtocolFile,
  getStudioFileSource,
  validateStudioFile,
  getIndexJscHash,
  DUMMY_INDEX_JSC_HASH,
}
