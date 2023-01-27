const minimist = require('minimist')
const os = require('os')
const { execSync } = require('child_process')

const validatePlatform = () => {
  const platform = os.platform()

  if (platform !== 'linux' && platform !== 'darwin') {
    throw new Error('Can only prepare release artifacts on a Mac or Linux machine.')
  }
}

const validateSha = (sha) => {
  if (!/^[a-z0-9]{40}$/.test(sha)) {
    throw new Error('A valid (40 character) commit SHA must be passed in `--sha`.')
  }
}
const validateVersion = (version) => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('A valid semantic version (X.Y.Z) must be passed in `--version`.')
  }
}

// eslint-disable-next-line no-console
const log = (...args) => console.log('🏗', ...args)

const prepareReleaseArtifacts = async (sha, version, dryRun = false) => {
  log('Preparing Release Artifacts')

  validatePlatform()
  validateSha(sha)
  validateVersion(version)

  const exec = dryRun ?
    (...args) => log('Dry run, not executing:', args[0])
    : (...args) => execSync(...args)

  log('Running `move-binaries`...')
  exec(`node ./binary.js move-binaries --sha ${sha} --version ${version}`, { stdio: 'inherit' })

  const prereleaseNpmUrl = `https://cdn.cypress.io/beta/npm/${version}/linux-x64/develop-${sha}/cypress.tgz`

  log('Running `create-stable-npm-package`...')

  return exec(`./create-stable-npm-package.sh ${prereleaseNpmUrl}`, { stdio: 'inherit' })
}

if (require.main === module) {
  const args = minimist(process.argv.slice(2))

  prepareReleaseArtifacts(args.sha, args.version, args['dry-run'])
}

module.exports = {
  prepareReleaseArtifacts,
}
