/* eslint-disable no-console */

// http://stackoverflow.com/questions/1683531/how-to-import-existing-git-repository-into-another#answer-8396318

const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

const from = argv.from
const to = path.join(argv.to, '/') // ensure trailing slash
const branch = argv.banch || 'master'
const remoteName = snakeCase(to)

function exec (command) {
  console.log(command)
  execSync(command, { stdio: 'inherit' })
}

console.log(`Importing ${from} (${branch}) to ${to}`)
console.log('---------')
exec(`git remote add ${remoteName} ${from}`)
exec(`git fetch ${remoteName}`)
exec(`git merge -s ours --allow-unrelated-histories --no-commit ${remoteName}/${branch}`)
exec(`git read-tree --prefix=${to} -u ${remoteName}/${branch}`)
exec(`git commit -m "import ${to} (${branch})"`)
console.log('---------')
console.log(`Finished mporting ${from} (${branch}) to ${to}`)
