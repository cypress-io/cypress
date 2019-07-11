const cp = require('child_process')
const chalk = require('chalk')
const pkg = require('../package.json')

const INSPECT_PORT = 5566

const script = process.argv[2]

if (!script) {
  throw new Error('Missing script argument')
}

const pkgScript = pkg.scripts[script]

if (!pkgScript) {
  throw new Error(`package.json scripts not found for script: ${script}`)
}

const [cmd, ...args] = pkgScript.split(' ')
const userArgs = process.argv.slice(3)

args.unshift(`--inspect-brk=${INSPECT_PORT}`)
args.push(...userArgs)

const log = (k, v) => {
  // eslint-disable-next-line
  console.log(chalk.yellow(k), chalk.cyan(v))
}

log('Node:', process.version)
log('Script:', script)
log('Spawning:', pkgScript)

cp.spawn(cmd, args, {
  stdio: 'inherit',
})
