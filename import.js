/* eslint-disable no-console */

// http://stackoverflow.com/questions/1683531/how-to-import-existing-git-repository-into-another#answer-8396318

const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const argv = require('minimist')(process.argv.slice(2))

const from = argv.from
const to = argv.to
const remoteName = snakeCase(to)

function exec (command) {
  console.log(command)
  execSync(command, { stdio: 'inherit' })
}

exec(`git remote add ${remoteName} ${from}`)
exec(`git fetch ${remoteName}`)
exec(`git merge -s ours --allow-unrelated-histories --no-commit ${remoteName}/master`)
exec(`git read-tree --prefix=packages/${to}/ -u ${remoteName}/master`)
exec(`git commit -m "import ${to}"`)
