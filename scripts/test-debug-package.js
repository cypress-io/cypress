const cp = require('child_process')
const path = require('path')
const chalk = require('chalk')
const finder = require('find-package-json')

const DEFAULT_SCRIPT = 'yarn test --inspect-brk=5566'

const file = process.argv[2]

// walks up from the file until it finds the first
// package.json in a parent folder
const { value: pkg, filename } = finder(file).next()

const script = pkg.scripts['test-debug'] || DEFAULT_SCRIPT

const [cmd, ...args] = script.split(' ')

const log = (k, v) => {
  // eslint-disable-next-line
  console.log(chalk.yellow(k), chalk.cyan(v))
}

log('Node version:', process.version)
log('Debug script:', script)
log('Debugging test file:', file)

cp.spawn(cmd, args.concat(file), {
  cwd: path.dirname(filename),
  stdio: 'inherit',
})
