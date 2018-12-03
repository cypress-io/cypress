// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const md5 = require('md5')
const path = require('path')
const debug = require('debug')('cypress:server:saved_state')
const Promise = require('bluebird')
const sanitize = require('sanitize-filename')
const cwd = require('../cwd')
const fs = require('../util/fs')

const toHashName = function (projectRoot) {
  if (!projectRoot) {
    throw new Error('Missing project path')
  }

  if (!path.isAbsolute(projectRoot)) {
    throw new Error(`Expected project absolute path, not just a name ${projectRoot}`)
  }

  const name = sanitize(path.basename(projectRoot))
  const hash = md5(projectRoot)

  return `${name}-${hash}`
}

// async promise-returning method
const formStatePath = (projectRoot) => {
  return Promise.try(() => {
    debug('making saved state from %s', cwd())

    if (projectRoot) {
      debug('for project path %s', projectRoot)

      return projectRoot
    }

    debug('missing project path, looking for project here')

    const cypressJsonPath = cwd('cypress.json')

    return fs.pathExistsAsync(cypressJsonPath)
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressJsonPath)
        projectRoot = cwd()
      }

      return projectRoot
    })
  }).then((projectRoot) => {
    const fileName = 'state.json'

    if (projectRoot) {
      debug(`state path for project ${projectRoot}`)

      return path.join(toHashName(projectRoot), fileName)
    }

    debug('state path for global mode')

    return path.join('__global__', fileName)
  })
}


module.exports = {
  toHashName,
  formStatePath,
}
