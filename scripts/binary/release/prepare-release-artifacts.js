const minimist = require('minimist')
const os = require('os')
const { execSync } = require('child_process')
const { moveBinaries } = require('../move-binaries')

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

  log('Running `move-binaries`...')
  const args = [null, null, '--sha', sha, '--version', version, '--skip-confirmation']

  if (dryRun) {
    args.push('--dry-run')
  }

  await moveBinaries(args)

  const prereleaseNpmUrl = `https://cdn.cypress.io/beta/npm/${version}/linux-x64/develop-${sha}/cypress.tgz`

  log('Running `create-stable-npm-package`...')
  let output = execSync(`./create-stable-npm-package.sh ${prereleaseNpmUrl}`, { cwd: __dirname, stdio: 'pipe', encoding: 'utf8' })

  // eslint-disable-next-line
  console.log(output)

  output = output.split('\n')

  // return tgz path
  return output[output.length - 2].trim()
}

if (require.main === module) {
  const args = minimist(process.argv.slice(2))

  prepareReleaseArtifacts(args.sha, args.version, args['dry-run'])
}

module.exports = {
  prepareReleaseArtifacts,
}
