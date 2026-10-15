import * as ciProvider from '@packages/server/lib/util/ci_provider'
import commitInfoUtil from '@packages/server/lib/util/commit-info'
import pkg from '@packages/root'
import rp from '@cypress/request-promise'
import Debug from 'debug'

const debug = Debug('cypress:performance')

const API_URL = process.env.PERF_API_URL || 'http://localhost:2999/track'
const API_KEY = process.env.PERF_API_KEY

// Store this performance record permanently.
export function track (type: string, data: Record<string, unknown>): Promise<unknown> {
  if (!API_KEY) {
    debug('skip tracking "%s", API key is not set', type)

    return Promise.resolve()
  }

  debug('getting commit information')

  return commitInfoUtil.commitInfo()
  .then((commitInformation) => {
    const ciInformation = ciProvider.commitParams() || {}
    const timestamp = commitInformation.timestamp || ciInformation.timestamp
    const timestampISO = new Date(timestamp * 1000).toISOString()

    const body = {
      type,
      data: {
        'package.json Version': pkg.version,
        'Commit SHA': commitInformation.sha || ciInformation.sha,
        'Commit Branch': commitInformation.branch || ciInformation.branch,
        'Commit Author': commitInformation.author || ciInformation.author,
        'Commit Message': commitInformation.message || ciInformation.message,
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
