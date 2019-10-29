const ciProvider = require('../../../lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')
const pkg = require('../../../../../package.json')
const Promise = require('bluebird')
const rp = require('request-promise')

const API_URL = process.env.PERF_API_URL || 'http://localhost:2999/track'
const API_KEY = process.env.PERF_API_KEY

// Store this performance record permanently.
function track (type, data) {
  if (!API_KEY) {
    return Promise.resolve()
  }

  return commitInfo()
  .then(({ message, timestamp }) => {
    const { sha, branch, author } = ciProvider.commitParams()

    timestamp = new Date(timestamp * 1000).toISOString()

    const body = {
      type,
      data: {
        'package.json Version': pkg.version,
        'Next Version': process.env.NEXT_DEV_VERSION,
        'Commit SHA': sha,
        'Commit Branch': branch,
        'Commit Author': author,
        'Commit Message': message,
        'Commit Timestamp': timestamp,
        'Build URL': process.env.CIRCLE_BUILD_URL,
        'Build Platform': process.platform,
        'Build Arch': process.arch,
        ...data,
      },
    }

    return rp.post({
      url: API_URL,
      json: true,
      headers: {
        authorization: `token ${API_KEY}`,
      },
      body,
      timeout: 5000,
    })
  })
  .catchReturn()
}

module.exports = {
  track,
}
