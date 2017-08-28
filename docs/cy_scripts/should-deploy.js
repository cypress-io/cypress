'use strict'

const got = require('got')
const git = require('ggit')
const pluralize = require('pluralize')
const debug = require('debug')('deploy')
const { isEmpty, complement, filter, test, tap, path, all, equals, T, values } = require('ramda')
const la = require('lazy-ass')
const is = require('check-more-types')

const justDocs = filter(test(/^docs\//))
const docsChanged = complement(isEmpty)

const isForced = process.argv.some(equals('--force'))

const isValidEnvironment = is.oneOf(['staging', 'production'])

/* eslint-disable no-console */
/* global Promise */

function isRightBranch (env) {
  la(is.unemptyString(env), 'expected environment name', env)

  // allow multiple branches to deploy to staging environment,
  // just add to the keys in this object
  // "my-fix-branch": "staging"
  const branchToEnv = {
    develop: 'staging',
    master: 'production',
  }

  const isDocsToStagingBranch = (branch) =>
    branch.startsWith('docs-') && env === 'staging'

  const isBranchAllowedToDeploy = (branch) => {
    if (isDocsToStagingBranch(branch)) {
      console.log('documentation branch %s is allowed to deploy to %s',
        branch, env)
      return true
    }

    if (!values(branchToEnv).includes(env)) {
      console.log('could not get branch for environment', env)
      return false
    }

    const allowed = branchToEnv[branch] === env
    console.log('branch %s is valid for env %s?', branch, env, allowed)
    return allowed
  }

  let branch
  return git.branchName()
    .then(tap((name) => {
      console.log('branch name', name)
      branch = name
    }))
    .then(isBranchAllowedToDeploy)
    .then(tap((rightBranch) => {
      console.log('is branch %s allowed to deploy %s?',
        branch, env, rightBranch)
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
  la(is.unemptyString(env), 'missing environment', env)

  const url = buildUrlForEnvironment(env)
  la(url, 'could not get build url for environment', env)

  debug('checking last deploy info using url %s', url)
  return got(url, { json: true })
    .then(path(['body', 'id']))
    .then(tap((id) => {
      console.log('docs last deployed for commit', id)
    }))
}

const changedFilesSince = (branchName) => (sha) => {
  la(is.unemptyString(branchName), 'missing branch name', branchName)
  return git.changedFilesAfter(sha, branchName)
    .then(tap((list) => {
      debug('%s changed since last docs deploy in branch %s',
        pluralize('file', list.length, true), branchName)
      debug(list.join('\n'))
    }))
}

function docsFilesChangedSinceLastDeploy (env, branchName) {
  return lastDeployedCommit(env)
    .then(changedFilesSince(branchName))
    .then(justDocs)
    .then(tap((list) => {
      console.log('changed files')
      console.log(list.join('\n'))
      console.log('%d documentation %s changed since last doc deploy',
        list.length, pluralize('file', list.length))
      console.log('in branch %s against environment %s', branchName, env)
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
  if (!isValidEnvironment(env)) {
    console.log('invalid environment', env)
    return Promise.resolve(false)
  }

  return git.branchName()
    .then((branchName) => {
      const questions = [
        isRightBranch(env),
        docsFilesChangedSinceLastDeploy(env, branchName),
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
    })
}

module.exports = shouldDeploy

if (!module.parent) {
  // see list of changed files since last docs deploy
  // lastDeployedCommit()
  //   .then(changedFilesSince)
  //   .then(console.log)
  //   .catch(console.error)

  shouldDeploy('staging')
    .then((should) => {
      console.log('should deploy?', should)
    })
    .catch(console.error)
}
