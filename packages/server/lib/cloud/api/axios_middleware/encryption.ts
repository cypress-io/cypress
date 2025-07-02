import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import * as enc from '../../encryption'
import { PUBLIC_KEY_VERSION } from '../../constants'
import crypto, { KeyObject } from 'crypto'
import { DecryptionError } from '../cloud_request_errors'
import axios from 'axios'

let encryptionKey: KeyObject

declare module 'axios' {
  interface AxiosRequestConfig {
    encrypt?: 'always' | 'signed' | boolean
  }
}

const encryptRequest = async (req: InternalAxiosRequestConfig) => {
  if (!req.data) {
    throw new Error(`Cannot issue encrypted request to ${req.url} without request body`)
  }

  encryptionKey ??= crypto.createSecretKey(Uint8Array.from(crypto.randomBytes(32)))

  const { jwe } = await enc.encryptRequest({ body: req.data }, { secretKey: encryptionKey })

  req.headers.set('x-cypress-encrypted', PUBLIC_KEY_VERSION)
  req.data = jwe

  return req
}

const signRequest = (req: InternalAxiosRequestConfig) => {
  req.headers.set('x-cypress-signature', PUBLIC_KEY_VERSION)

  return req
}

const maybeDecryptResponse = async (res: AxiosResponse) => {
  if (!res.config.encrypt) {
    return res
  }

  if (res.config.encrypt === 'always' || res.headers['x-cypress-encrypted']) {
    try {
      res.data = await enc.decryptResponse(res.data, encryptionKey)
    } catch (e) {
      throw new DecryptionError(e.message)
    }
  }

  return res
}

const maybeDecryptErrorResponse = async (err: AxiosError<any> | Error & { error?: any, statusCode: number, isApiError?: boolean }) => {
  if (axios.isAxiosError(err) && err.response?.data) {
    if (err.config?.encrypt === 'always' || err.response?.headers['x-cypress-encrypted']) {
      try {
        if (err.response.data) {
          err.response.data = await enc.decryptResponse(err.response.data, encryptionKey)
        }
      } catch (e) {
        if (err.status && err.status >= 500 || err.status === 404) {
          throw err
        }

        throw new DecryptionError(e.message)
      }
    }
  }

  throw err
}

const maybeVerifyResponseSignature = (res: AxiosResponse) => {
  if (res.config.encrypt === 'signed' && !res.headers['x-cypress-signature']) {
    throw new Error(`Expected signed response for ${res.config.url }`)
  }

  if (res.headers['x-cypress-signature']) {
    const dataString = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    const verified = enc.verifySignature(dataString, res.headers['x-cypress-signature'])

    if (!verified) {
      throw new Error(`Unable to verify response signature for ${res.config.url}`)
    }
  }

  return res
}

// Always = req & res MUST be encrypted
// true = req MUST be encrypted, res MAY be encrypted, signified by header
// signed = verify signature of the response body
export const installEncryption = (axios: AxiosInstance) => {
  axios.interceptors.request.use(encryptRequest, undefined, {
    runWhen (config) {
      return config.encrypt === true || config.encrypt === 'always'
    },
  })

  axios.interceptors.request.use(signRequest, undefined, {
    runWhen (config) {
      return config.encrypt === 'signed'
    },
  })

  axios.interceptors.response.use(maybeDecryptResponse, maybeDecryptErrorResponse)
  axios.interceptors.response.use(maybeVerifyResponseSignature)
}
