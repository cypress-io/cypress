const ciProvider = require('../../../lib/util/ci_provider')
const { commitInfo } = require('@cypress/commit-info')
const pkg = require('../../../../../package.json')
const Promise = require('bluebird')
const rp = require('@cypress/request-promise')
const debug = require('debug')('cypress:performance')
const R = require('ramda')

const API_URL = process.env.PERF_API_URL || 'http://localhost:2999/track'
const API_KEY = process.env.PERF_API_KEY

// Store this performance record permanently.
function track (type, data) {
  if (!API_KEY) {
    debug('skip tracking "%s", API key is not set', type)

    return Promise.resolve()
  }

  debug('getting commit information')

  return commitInfo()
  .then((commitInformation) => {
    const ciInformation = ciProvider.commitParams() || {}
    const merged = R.mergeWith(R.or, commitInformation, ciInformation)
    const { sha, branch, author, message, timestamp } = merged
    const timestampISO = new Date(timestamp * 1000).toISOString()

    const body = {
      type,
      data: {
        'package.json Version': pkg.version,
        'Next Version': process.env.NEXT_DEV_VERSION,
        'Commit SHA': sha,
        'Commit Branch': branch,
        'Commit Author': author,
        'Commit Message': message,
        'Commit Timestamp': timestampISO,
        'Build URL': process.env.CIRCLE_BUILD_URL,
        'Build Platform': process.platform,
        'Build Arch': process.arch,
        ...data,
      },
    }

    debug('sending performance numbers "%s"', type)
    debug('%o', body.data)

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
  .catch((err) => {
    console.error('Track error for type %s %s', type, err.message)
  })
}

module.exports = {
  track,
}
