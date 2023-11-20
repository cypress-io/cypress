const path = require('path')
const execa = require('execa')
const inspector = require('inspector')
const debug = require('debug')('cypress:scripts')

const args = process.argv.slice(2)

const pathToCli = path.resolve(__dirname, '..', 'cli', 'bin', 'cypress')

if (inspector.url()) {
  process.CYPRESS_INTERNAL_DEV_DEBUG = `--inspect=${process.debugPort + 1}`
}

// always run the CLI in dev mode
// so it utilizes the development binary
// instead of the globally installed prebuilt one
args.push('--dev')

debug('starting the CLI in dev mode with args %o', {
  command: pathToCli,
  args,
})

const exit = ({ exitCode }) => {
  if (typeof exitCode !== 'number') {
    console.error(`missing exit code from execa (received ${exitCode})`)
    process.exit(1)
  }

  process.exit(exitCode)
}

execa(pathToCli, args, { stdio: 'inherit' })
.then(exit)
.catch(exit)
