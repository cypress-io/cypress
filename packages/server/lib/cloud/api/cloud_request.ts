import os from 'os'

import axios, { AxiosInstance } from 'axios'

import pkg from '@packages/root'
import { httpAgent, httpsAgent } from '@packages/network/lib/agent'

import app_config from '../../../config/app.json'
import { transformError } from './transform_error'
import { logRequest, logResponse, logResponseErr } from './log_requests'

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

  instance.interceptors.request.use(logRequest)
  instance.interceptors.response.use(logResponse, logResponseErr)
  instance.interceptors.response.use(undefined, transformError)

  return instance
}

export const CloudRequest = _create()
