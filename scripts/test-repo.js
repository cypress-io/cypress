#!/usr/bin/env node

/* eslint-disable no-console */

const shell = require('shelljs')
const path = require('path')
const os = require('os')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

const isWindows = os.platform() === 'win32'

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

const startCommand = isWindows ? 'npm run start:ci:windows' : 'npm run start:ci'

console.log('starting server in background with command "%s"', startCommand)

const server = shell.exec(startCommand, { cwd: repoFolder }, (code, stdout, stderr) => {
  if (code) {
    console.error('npm start finished with')
    console.error(stderr)
  }
})

console.log('running Cypress')
shell.exec(`npm run cypress:run -- --project ${repoFolder}`)

console.log('closing background server process')
server.kill('SIGTERM')
