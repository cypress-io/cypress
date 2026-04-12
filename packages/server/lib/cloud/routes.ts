import UrlParse from 'url-parse'

const app_config = require('../../config/app.json')

export const apiUrl = app_config[process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'].api_url

const CLOUD_ENDPOINTS = {
  api: '',
  auth: 'auth',
  ping: 'ping',
  runs: 'runs',
  instances: 'runs/:id/instances',
  instanceTests: 'instances/:id/tests',
  instanceResults: 'instances/:id/results',
  instanceStdout: 'instances/:id/stdout',
  instanceArtifacts: 'instances/:id/artifacts',
  captureProtocolErrors: 'capture-protocol/errors',
  studioSession: 'studio/session',
  studioErrors: 'studio/errors',
  cyPromptSession: 'cy-prompt/session',
  cyPromptErrors: 'cy-prompt/errors',
  exceptions: 'exceptions',
  telemetry: 'telemetry',
} as const

const parseArgs = function (url, args: any[] = []) {
  for (const value of args) {
    if (typeof value === 'object' && value !== null) {
      url.set('query', Object.assign(url.query, value))

      continue
    }

    if (typeof value === 'string' || typeof value === 'number') {
      url.set('pathname', url.pathname.replace(':id', value))

      continue
    }
  }

  return url
}

const _makeRoutes = (baseUrl: string, routes: typeof CLOUD_ENDPOINTS) => {
  const memo = {} as Record<keyof typeof CLOUD_ENDPOINTS, (...args: any[]) => string>

  for (const [key, value] of Object.entries(routes)) {
    memo[key as keyof typeof CLOUD_ENDPOINTS] = function (...args: any[]) {
      let url = new UrlParse(baseUrl, true)

      if (value) {
        url.set('pathname', value)
      }

      if (args.length) {
        url = parseArgs(url, args)
      }

      return url.toString()
    }
  }

  return memo
}

export const apiRoutes = _makeRoutes(apiUrl, CLOUD_ENDPOINTS)

export const makeRoutes = (baseUrl) => _makeRoutes(baseUrl, CLOUD_ENDPOINTS)
