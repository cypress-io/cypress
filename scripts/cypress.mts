import inspector from 'node:inspector'
import path from 'node:path'
import Debug from 'debug'
import execa from 'execa'

const debug = Debug('cypress:scripts')

const args = process.argv.slice(2)

const pathToCli = path.resolve(import.meta.dirname, '..', 'cli', 'bin', 'cypress')

if (inspector.url()) {
  process.env.CYPRESS_INTERNAL_DEV_DEBUG = `--inspect=${process.debugPort + 1}`
}

// always run the CLI in dev mode
// so it utilizes the development binary
// instead of the globally installed prebuilt one
args.push('--dev')

debug('starting the CLI in dev mode with args %o', {
  command: pathToCli,
  args,
})

const exit = ({ exitCode }: { exitCode?: number }) => {
  if (typeof exitCode !== 'number') {
    console.error(`missing exit code from execa (received ${exitCode})`)
    process.exit(1)
  }

  process.exit(exitCode)
}

execa(pathToCli, args, { stdio: 'inherit' })
.then(exit)
.catch(exit)
