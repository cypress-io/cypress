const _ = require('lodash')
const execa = require('execa')
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
    execa.stdout('git', ['rev-parse', 'HEAD']),
    execa.stdout('git', ['log', 'HEAD', '-1', '|', 'tail', '-n1'], { shell: true }).then(_.trim),
    execa.stdout('git', ['log', '-1', '--format=%cd']).then((d) => new Date(d).toISOString()),
    execa.stdout('git', ['branch', '|', 'grep', '\\*', '|', 'cut', '-d', '\'', '\'', '-f2'], { shell: true }),
    (commitSha, commitMessage, commitTimestamp, branch) => {
      const body = {
        type,
        data: {
          'Commit SHA': commitSha,
          'Commit Message': commitMessage,
          'Commit Timestamp': commitTimestamp,
          'Branch': branch,
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
