/* eslint-disable no-console */

const { execSync } = require('child_process')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

function exec (command, args = {}) {
  console.log(command)
  execSync(command, { stdio: 'inherit', ...args })
}

const pack = argv._[0]

console.log(`Running semantic release for ${pack}`)

exec(`node ${path.join(__dirname, 'inject-npm-version.js')} ${pack}`)
exec(`lerna exec --scope ${pack} -- npx --no-install semantic-release --dry-run`)
