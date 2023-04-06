/*
Usage - All arguments are required
--from <path>       local path to repository to import
--branch <name>     branch to import from repo
--repo <name>       full name of repo to import (ex. cypress-io/cypress-webpack-preprocessor)
--to <path>         path in this repo to import into to
*/

// http://stackoverflow.com/questions/1683531/how-to-import-existing-git-repository-into-another#answer-8396318

const { snakeCase } = require('lodash')
const { execSync } = require('child_process')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

const from = argv.from
const repo = argv.repo
const to = path.join(argv.to, '/') // ensure trailing slash
const branch = argv.branch || 'develop'
const remoteName = snakeCase(to)
const temp = path.join(process.cwd(), `.temp-import`)

function exec (command, args = {}) {
  console.log(command)
  execSync(command, { stdio: 'inherit', ...args })
}

console.log()
console.log(`Importing ${repo} (${branch}) to ${to}`)
console.log('---------')
exec(`mkdir ${temp}`)
exec(`cp -r ${from}/.git ${temp}`)
exec(`git reset --hard HEAD`, { cwd: temp })
exec(`git tag | xargs git tag -d`, { cwd: temp })
exec(`git filter-branch --msg-filter "sed 's|#[[:digit:]]*|${repo}&|g'" -- --all`, { cwd: temp })
exec(`git remote add ${remoteName} ${temp}`)
exec(`git fetch ${remoteName}`)
exec(`git merge -s ours --allow-unrelated-histories --no-commit ${remoteName}/${branch}`)
exec(`git read-tree --prefix=${to} -u ${remoteName}/${branch}`)
exec(`git commit -m "import ${repo} to ${to}" --no-verify`)
exec(`git remote remove ${remoteName}`)
exec(`rm -rf ${temp}`)
console.log('---------')
console.log(`Finished importing ${repo} (${branch}) to ${to}`)
