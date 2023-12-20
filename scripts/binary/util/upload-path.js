const os = require('os')

const S3Configuration = {
  bucket: 'cdn.cypress.io',
  releaseFolder: 'desktop',
  binaryZipName: 'cypress.zip',
  betaUploadTypes: {
    binary: {
      uploadFolder: 'binary',
      uploadFileName: 'cypress.zip',
    },
    'npm-package': {
      uploadFolder: 'npm',
      uploadFileName: 'cypress.tgz',
    },
  },
}

const getUploadUrl = function () {
  return `https://${S3Configuration.bucket}`
}

const formHashFromEnvironment = function () {
  const {
    env,
  } = process

  if (env.CIRCLECI) {
    return `${env.CIRCLE_BRANCH}-${env.CIRCLE_SHA1}`
  }

  throw new Error('Do not know how to form unique build hash on this CI')
}

const getReleaseUrl = function (version, platformArch, zipName) {
  const url = getUploadUrl()

  return [
    url,
    getFullUploadPath({
      folder: S3Configuration.releaseFolder,
      version,
      platformArch,
      name: zipName || S3Configuration.binaryZipName,
    }),
  ].join('/')
}

// the artifact will be uploaded for every platform and uploaded into under a unique folder
// https://cdn.cypress.io/beta/(binary|npm)/<version>/<platform>/<some unique version info>/cypress.zip
// For binary:
//     beta/binary/9.4.2/win32-x64/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.zip
// For NPM package:
//     beta/npm/9.4.2/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.tgz
const getBetaUploadPath = function ({ type, version, platformArch, hash }) {
  return [
    'beta',
    getFullUploadPath({
      folder: S3Configuration.betaUploadTypes[type].uploadFolder,
      version,
      platformArch: platformArch || getUploadNameByOsAndArch(process.platform),
      hash: hash || formHashFromEnvironment(),
      name: S3Configuration.betaUploadTypes[type].uploadFileName,
    }),
  ].join('/')
}

const getBetaUploadPathUrl = (options) => {
  const uploadUrl = getUploadUrl()

  return [uploadUrl, getBetaUploadPath(options)].join('/')
}

// store uploaded application in subfolders by version and platform
// something like desktop/0.20.1/darwin-x64/

// the artifact will be uploaded for every platform and uploaded into under a unique folder
// https://cdn.cypress.io/beta/(binary|npm)/<version>/<platform>/<some unique version info>/cypress.zip
// For binary:
//     beta/binary/9.4.2/win32-x64/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.zip
// For NPM package:
//     beta/npm/9.4.2/develop-219138ca4e952edc4af831f2ae16ce659ebdb50b/cypress.tgz
const getFullUploadPath = (options) => {
  let { folder, version, platformArch, hash, name } = options

  if (!folder) {
    console.log('defaulting to default release folder')
    folder = S3Configuration.releaseFolder
  }

  if (!options.folder) {
    throw new Error('missing upload folder')
  }

  // la(check.semver(version), 'missing or invalid version', options)
  if (!options.version) {
    throw new Error('missing or invalid version')
  }

  if (!options.name) {
    throw new Error('missing file name')
  }

  if (!isValidPlatformArch(platformArch)) {
    throw new Error(`${platformArch} invalid platform and arch`)
  }

  return [folder, version, platformArch, hash, name].join('/')
}

// all architectures we are building the test runner for
const validPlatformArchs = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64', 'win32-x64']

// simple check for platform-arch string
// example: isValidPlatformArch("darwin") // FALSE
const isValidPlatformArch = (name) => validPlatformArchs.includes(name)

const getValidPlatformArchs = () => {
  return validPlatformArchs
}

const getUploadNameByOsAndArch = function (platform) {
  const arch = os.arch()

  const name = [platform, arch].join('-')

  if (!isValidPlatformArch(name)) {
    throw new Error(`${name} is not a valid upload destination. Does validPlatformArchs need updating?`)
  }

  return name
}

module.exports = {
  S3Configuration,
  getBetaUploadPathUrl,
  getBetaUploadPath,
  getUploadNameByOsAndArch,
  getReleaseUrl,
  validPlatformArchs,
  getValidPlatformArchs,
  isValidPlatformArch,
  formHashFromEnvironment,
  getUploadUrl,
}
