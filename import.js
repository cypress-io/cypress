const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const argv = require('yargs').argv

const from = argv.from
const to = argv.to
const remotePrefix = snakeCase(to)

execSync(`git remote add ${remotePrefix}_remote ${from}`)
execSync(`git fetch ${remotePrefix}_remote`)
execSync(`git merge -s ours --no-commit ${remotePrefix}_remote/master`)
execSync(`git read-tree --prefix=packages/${to}/ -u ${remotePrefix}_remote/master`)
execSync(`git commit -m "import ${to}"`)
