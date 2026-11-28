import { spawn } from 'node:child_process'
import chalk from 'chalk'
import pkg from '../package.json' with { type: 'json' }

const INSPECT_PORT = 5566

const script = process.argv[2]

if (!script) {
  throw new Error('Missing script argument')
}

const scripts: Record<string, string> = pkg.scripts
const pkgScript = scripts[script]

if (!pkgScript) {
  throw new Error(`package.json scripts not found for script: ${script}`)
}

const [cmd, ...args] = pkgScript.split(' ')
const userArgs = process.argv.slice(3)

args.unshift(`--inspect-brk=${INSPECT_PORT}`)
args.push(...userArgs)

const log = (k: string, v: string) => {
  console.log(chalk.yellow(k), chalk.cyan(v))
}

log('Node:', process.version)
log('Script:', script)
log('Spawning:', pkgScript)

spawn(cmd, args, {
  stdio: 'inherit',
})
