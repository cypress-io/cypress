const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')

const LOCAL_OVERRIDE_VARIABLES = ['CYPRESS_LOCAL_PROTOCOL_PATH', 'CYPRESS_LOCAL_STUDIO_PATH', 'CYPRESS_LOCAL_CY_PROMPT_PATH']

const getTestEncryptionKey = async () => {
  const encryptionSource = await fs.readFile(path.join(__dirname, '../../packages/server/lib/cloud/encryption.ts'), 'utf8')
  const testKey = encryptionSource.match(/const CY_TEST = `(.*?)`/)?.[1]

  if (!testKey) {
    throw new Error(`Expected to find the test key in cloud encryption.ts`)
  }

  return testKey
}

// Checks the bundles and every other file the binary ships under packages/server, so a new read of a local override
// that is missing from the rewrites fails the build
const validateShippedServerCode = async (serverDir, testKey) => {
  testKey ??= await getTestEncryptionKey()

  const files = glob.sync('**/*.{js,cjs}', { cwd: serverDir, ignore: ['node_modules/**'], nodir: true })
  const problems = []

  await Promise.all(files.map(async (file) => {
    const contents = await fs.readFile(path.join(serverDir, file), 'utf8')

    for (const variable of LOCAL_OVERRIDE_VARIABLES) {
      if (contents.includes(variable)) {
        problems.push(`${file} reads ${variable}`)
      }
    }

    if (contents.includes(testKey)) {
      problems.push(`${file} contains the test encryption key`)
    }
  }))

  if (problems.length) {
    throw new Error(`The binary's server code still contains local development overrides:\n${problems.sort().join('\n')}`)
  }
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

const getCyPromptFileSource = async (cyPromptFilePath) => {
  const fileContents = await fs.readFile(cyPromptFilePath, 'utf8')

  if (!fileContents.includes('process.env.CYPRESS_LOCAL_CY_PROMPT_PATH')) {
    throw new Error(`Expected to find CYPRESS_LOCAL_CY_PROMPT_PATH in cy prompt file`)
  }

  return fileContents.replaceAll('process.env.CYPRESS_LOCAL_CY_PROMPT_PATH', 'undefined')
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

const validateCyPromptFile = async (cyPromptFilePath) => {
  const afterReplaceCyPrompt = await fs.readFile(cyPromptFilePath, 'utf8')

  if (afterReplaceCyPrompt.includes('process.env.CYPRESS_LOCAL_CY_PROMPT_PATH')) {
    throw new Error(`Expected process.env.CYPRESS_LOCAL_CY_PROMPT_PATH to be stripped from cy prompt file`)
  }
}

module.exports = {
  getEncryptionFileSource,
  validateEncryptionFile,
  getCloudEnvironmentFileSource,
  validateCloudEnvironmentFile,
  getProtocolFileSource,
  validateProtocolFile,
  getStudioFileSource,
  validateStudioFile,
  getCyPromptFileSource,
  validateCyPromptFile,
  validateShippedServerCode,
}
