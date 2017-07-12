/* eslint-disable no-console */

const path = require('path')
const Promise = require('bluebird')
const R = require('ramda')
const chalk = require('chalk')
const la = require('lazy-ass')
const is = require('check-more-types')
const { stripIndent } = require('common-tags')

const fs = Promise.promisifyAll(require('fs-extra'))

// environment variables set via shell have restrictions
// so remove invalid characters from the filename
// that cannot be there
function filenameToShellVariable (filename) {
  const rep = '_'
  return filename.replace(/\//g, rep)
    .replace(/\./g, rep)
    .replace(/-/g, rep)
}

function maybeLoadFromVariable (filename) {
  const key = filenameToShellVariable(filename)
  console.log('checking environment variable "%s"', key)
  if (process.env[key]) {
    console.log('loading from variable', key)
    return JSON.parse(process.env[key])
  }
}

function loadFromFile (key) {
  const pathToConfig = path.resolve(key)

  return fs.readJsonAsync(pathToConfig)
  .then(R.tap(() => {
    console.log('loaded credentials from file', key)
  }))
  .catch({ code: 'ENOENT' }, (err) => {
    console.log(chalk.red(stripIndent`
      Cannot deploy.

      You are missing your config.

      Please add your JSON config here: ${pathToConfig}
    `))
    throw err
  })
}

function configFromEnvOrJsonFile (filename) {
  la(is.unemptyString(filename), 'expected env key / filename', filename)
  return Promise.resolve()
    .then(() => maybeLoadFromVariable(filename))
    .then((env) => {
      if (env) {
        return env
      }
      return loadFromFile(filename)
    })
}

module.exports = {
  configFromEnvOrJsonFile,
}
