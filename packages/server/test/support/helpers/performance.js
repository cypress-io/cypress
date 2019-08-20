const _ = require('lodash')
const ciProvider = require('../../../lib/util/ci_provider')
const execa = require('execa')
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

  return Promise.join(
    execa.stdout('git', ['log', 'HEAD', '-1', '|', 'tail', '-n1'], { shell: true }).then(_.trim),
    execa.stdout('git', ['log', '-1', '--format=%cd']).then((d) => new Date(d).toISOString()),
    (commitMessage, commitTimestamp) => {
      const { sha, branch, author } = ciProvider.commitParams()

      const body = {
        type,
        data: {
          'package.json Version': pkg.version,
          'Next Version': process.env.NEXT_DEV_VERSION,
          'Commit SHA': sha,
          'Commit Branch': branch,
          'Commit Author': author,
          'Commit Message': commitMessage,
          'Commit Timestamp': commitTimestamp,
          'Build URL': process.env.CIRCLE_BUILD_URL,
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
    }
  )
  .catchReturn()
}

module.exports = {
  track,
}
