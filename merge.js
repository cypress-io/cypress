/* eslint-disable no-console */

// http://stackoverflow.com/questions/1683531/how-to-import-existing-git-repository-into-another#answer-8396318

const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

const to = path.join(argv._[0], '/') // ensure trailing slash
const branch = argv._[1] || 'master'
const remote = snakeCase(to)
const command = `git subtree pull --prefix=${to} ${remote} ${branch}`

console.log(`Merging remote ${remote} (${branch}) to ${to}`)
console.log('---------')
console.log(command)
execSync(command, { stdio: 'inherit' })
console.log('---------')
console.log(`Finished erging remote ${remote} (${branch}) to ${to}`)
