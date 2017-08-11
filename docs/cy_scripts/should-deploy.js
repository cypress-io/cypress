const got = require('got')
const git = require('ggit')
const pluralize = require('pluralize')
const debug = require('debug')('deploy')
const { isEmpty, complement, filter, test, tap, path, all, equals, T } = require('ramda')
const la = require('lazy-ass')
const is = require('check-more-types')

const justDocs = filter(test(/^docs\//))
const docsChanged = complement(isEmpty)

const isForced = process.argv.some(equals('--force'))

/* eslint-disable no-console */
/* global Promise */

const expectedBranch = 'master'

function isRightBranch () {
  return git.branchName()
    .then(tap((name) => {
      console.log('branch name', name)
    }))
    .then(equals(expectedBranch))
    .then(tap((rightBranch) => {
      console.log('is right branch?', rightBranch)
    }))
}

function buildUrlForEnvironment (env) {
  const urls = {
    staging: 'https://docs-staging.cypress.io/build.json',
    production: 'https://docs.cypress.io/build.json',
  }
  const url = urls[env]
  la(url, 'invalid build url for environment', env, url)
  return url
}

function lastDeployedCommit (env) {
  const url = buildUrlForEnvironment(env)
  la(url, 'could not get build url for environment', env)

  debug('checking last deploy info using url %s', url)
  return got(url, { json: true })
    .then(path(['body', 'id']))
    .then(tap((id) => {
      console.log('docs last deployed for commit', id)
    }))
}

function changedFilesSince (sha) {
  return git.changedFilesAfter(sha, expectedBranch)
    .then(tap((list) => {
      debug('%s changed since last docs deploy',
        pluralize('file', list.length, true))
      debug(list.join('\n'))
    }))
}

function docsFilesChangedSinceLastDeploy (env) {
  return lastDeployedCommit(env)
    .then(changedFilesSince)
    .then(justDocs)
    .then(tap((list) => {
      console.log('%d documentation %s changed since last doc deploy',
        list.length, pluralize('file', list.length))
      console.log(list.join('\n'))
    }))
    .then(docsChanged)
    .then(tap((hasDocumentChanges) => {
      console.log('has document changes?', hasDocumentChanges)
    }))
    .catch(T)
    // if cannot fetch last build, or some other exception
    // then should deploy!
}

// resolves with boolean true/false
function shouldDeploy (env = 'production') {
  la(is.unemptyString(env), 'missing deploy check environment')

  const questions = [
    isRightBranch(),
    docsFilesChangedSinceLastDeploy(env),
  ]
  return Promise.all(questions)
    .then(all(equals(true)))
    .then(Boolean)
    .then((result) => {
      if (isForced) {
        console.log('should deploy is forced!')
        return isForced
      }
      return result
    })
}

module.exports = shouldDeploy

if (!module.parent) {
  // see list of changed files since last docs deploy
  // lastDeployedCommit()
  //   .then(changedFilesSince)
  //   .then(console.log)
  //   .catch(console.error)

  shouldDeploy()
    .then((should) => {
      console.log('should deploy?', should)
    })
    .catch(console.error)
}
