const cp = require('child_process')
const path = require('path')

const webpackCli = path.join(__dirname, '..', 'node_modules', 'webpack-cli', 'bin', 'cli.js')

const NODE_OPTIONS = process.env.NODE_OPTIONS || ''

function buildCommand () {
  const file = process.argv.slice(2)
  const program = `node "${webpackCli}"`

  return file.length ? `${program } "${file.join('" "')}"` : program
}

const program = buildCommand()

cp.execSync(program, { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS } })
