// http://stackoverflow.com/questions/1683531/how-to-import-existing-git-repository-into-another#answer-8396318

const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const argv = require('yargs').argv

const remote = snakeCase(argv._[0])
const command = `git pull -s subtree ${remote} master`

console.log(command)
execSync(command)
