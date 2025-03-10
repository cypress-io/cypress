import os from 'os'

import axios, { AxiosInstance } from 'axios'

import pkg from '@packages/root'
import { httpAgent, httpsAgent } from '@packages/network/lib/agent'

import app_config from '../../../config/app.json'
import { installErrorTransform } from './axios_middleware/transform_error'
import { installLogging } from './axios_middleware/logging'

// initialized with an export for testing purposes
export const _create = (): AxiosInstance => {
  const cfgKey = process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'

  const instance = axios.create({
    baseURL: app_config[cfgKey].api_url,
    httpAgent,
    httpsAgent,
    headers: {
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'User-Agent': `cypress/${pkg.version}`,
    },
  })

  installLogging(instance)
  installErrorTransform(instance)

  return instance
}

export const CloudRequest = _create()

export const isRetryableCloudError = (error: unknown) => {
  // setting this env via mocha's beforeEach coerces this to a string, even if it's a boolean
  const disabled = process.env.DISABLE_API_RETRIES && process.env.DISABLE_API_RETRIES !== 'false'

  if (disabled) {
    return false
  }

  const axiosErr = axios.isAxiosError(error) ? error : undefined

  if (axiosErr && axiosErr.status) {
    return [408, 429, 500, 502, 503, 504].includes(axiosErr.status)
  }

  return true
}
