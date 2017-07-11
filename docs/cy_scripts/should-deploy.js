const got = require('got')
const git = require('ggit')
const { any, match, tap, path, all, equals } = require('ramda')

const docsChanged = any(match(/^docs\//))

/* eslint-disable no-console */
/* global Promise */

function isRightBranch () {
  return git.branchName()
    .then(tap((name) => {
      console.log('branch name', name)
    }))
    .then((name) => name === 'master')
}

function lastDeployedCommit () {
  // how to find production vs staging?
  const url = 'https://docs.cypress.io/build.json'
  return got(url, { json: true })
    .then(path(['body', 'id']))
    .then(tap((id) => {
      console.log('docs last deployed for commit', id)
    }))
}

function changedFilesSince (sha) {
  return git.changedFilesAfter(sha)
    .then(tap((list) => {
      console.log('files changed since last docs deploy')
      console.log(list.join('\n'))
    }))
}

function docsFilesChangedSinceLastDeploy () {
  return lastDeployedCommit()
    .then(changedFilesSince)
    .then(docsChanged)
}

// resolves with boolean true/false
function shouldDeploy () {
  const questions = [
    isRightBranch(),
    docsFilesChangedSinceLastDeploy(),
  ]
  return Promise.all(questions)
    .then(all(equals(true)))
    .then(Boolean)
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
