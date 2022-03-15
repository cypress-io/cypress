const minimist = require('minimist')
const shelljs = require('shelljs')

const args = minimist(process.argv.slice(2))

if (!/^[a-z0-9]{40}$/.test(args.sha)) {
  throw new Error('A valid (40 character) commit SHA must be passed in `--sha`.')
}

if (!/^\d+\.\d+\.\d+$/.test(args.version)) {
  throw new Error('A valid semantic version (X.Y.Z) must be passed in `--version`.')
}

// eslint-disable-next-line no-console
const log = (...args) => console.log('🏗', ...args)

const exec = args['dry-run'] ?
  (...args) => log('Dry run, not executing:', ...args)
  : (...args) => shelljs.exec(...args)

log('Running `move-binaries`...')
exec(`node ./scripts/binary.js move-binaries --sha ${args.sha} --version ${args.version}`)

const prereleaseNpmUrl = `https://cdn.cypress.io/beta/npm/${args.version}/linux-x64/develop-${args.sha}/cypress.tgz`

log('Running `create-stable-npm-package`...')
exec(`./scripts/create-stable-npm-package.sh ${prereleaseNpmUrl}`)
