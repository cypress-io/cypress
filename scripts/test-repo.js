#!/usr/bin/env node

/* eslint-disable no-console */

const shell = require('shelljs')
const path = require('path')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

const tempFolder = shell.tempdir()

console.log('Using temp folder: %s', tempFolder)
const repoFolder = path.join(tempFolder, 'repo')

if (shell.test('-d', repoFolder)) {
  console.log('deleting existing folder %s', repoFolder)
  shell.rm('-rf', repoFolder)
}

const repoName = 'cypress-example-kitchensink'
const repoUrl = `https://github.com/cypress-io/${repoName}.git`
const cmd = `git clone ${repoUrl} ${repoFolder}`

console.log(cmd)
shell.exec(cmd)

console.log('installing dependencies in %s', repoFolder)
shell.exec('npm install --production', { cwd: repoFolder })

console.log('starting server in background')
const server = shell.exec('npm start', { cwd: repoFolder }, (code, stdout, stderr) => {
  if (code) {
    console.error('npm start finished with')
    console.error(stderr)
  }
})

console.log('running Cypress')
shell.exec(`npm run cypress:run -- --project ${repoFolder}`)

console.log('closing background server process')
server.kill('SIGTERM')
