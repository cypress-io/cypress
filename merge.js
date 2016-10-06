const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const argv = require('yargs').argv

const remote = snakeCase(argv._[0])
const command = `git pull -s subtree ${remote} master`

console.log(command)
execSync(command)
