/**
 * The axios Cloud instance should not be used.
 */
import os from 'os'
import followRedirects from 'follow-redirects'
import axios, { AxiosInstance } from 'axios'
import pkg from '@packages/root'
import agent from '@packages/network/lib/agent'

import app_config from '../../../config/app.json'
import { installErrorTransform } from './axios_middleware/transform_error'
import { installLogging } from './axios_middleware/logging'
import { installEncryption } from './axios_middleware/encryption'

export interface CreateCloudRequestOptions {
  /**
   * The baseURL for all requests for this Cloud Request instance
   */
  baseURL?: string
  /**
   * Additional headers for the Cloud Request
   */
  additionalHeaders?: Record<string, string>
  /**
   * Whether to include the default logging middleware
   * @default true
   */
  enableLogging?: boolean
  /**
   * Whether to include the default error transformation
   * @default true
   */
  enableErrorTransform?: boolean
}

// Allows us to create customized Cloud Request instances w/ different baseURL & encryption configuration
export const createCloudRequest = (options: CreateCloudRequestOptions = {}): AxiosInstance => {
  const cfgKey = process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'
  const { baseURL = app_config[cfgKey].api_url, enableLogging = true, enableErrorTransform = true } = options

  const instance = axios.create({
    baseURL,
    httpAgent: agent,
    httpsAgent: agent,
    headers: {
      'x-os-name': os.platform(),
      'x-cypress-version': pkg.version,
      'User-Agent': `cypress/${pkg.version}`,
      ...options.additionalHeaders,
    },
    transport: {
      // https://github.com/axios/axios/issues/6313#issue-2198831362
      // Tapping into the transport seems the only way to handle this at the moment:
      // https://github.com/axios/axios/blob/a406a93e2d99c3317596f02f3537f5457a2a80fd/lib/adapters/http.js#L438-L450
      request (options, cb) {
        if ((process.env.HTTP_PROXY || process.env.HTTPS_PROXY) && options.headers['Proxy-Authorization']) {
          delete options.headers['Proxy-Authorization']
        }

        if (/https:?/.test(options.protocol)) {
          return followRedirects.https.request(options, cb)
        }

        return followRedirects.http.request(options, cb)
      },
    },
  })

  installEncryption(instance)

  if (enableLogging) {
    installLogging(instance)
  }

  if (enableErrorTransform) {
    installErrorTransform(instance)
  }

  return instance
}

export const CloudRequest = createCloudRequest()

export type TCloudReqest = ReturnType<typeof createCloudRequest>

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
