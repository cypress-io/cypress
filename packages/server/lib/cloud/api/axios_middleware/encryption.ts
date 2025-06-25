import type { AxiosInstance, AxiosResponse } from 'axios'
import * as enc from '../../encryption'
import { PUBLIC_KEY_VERSION } from '../../constants'
import { verifySignature } from '../../encryption'
import _ from 'lodash'
import { transformError } from './transform_error'

const verifySignatureHandler = async (res: AxiosResponse) => {
  const isVerified = verifySignature(res.data, res.headers['x-cypress-signature'])

  if (!isVerified) {
    throw new Error(`Unable to verify the request signature for ${res.request?.path ?? 'request'}`)
  }

  return res
}

// Always = req & res MUST be encrypted
// true = req MUST be encrypted, res MAY be encrypted, signified by header
// signed = verify signature of the response body
export const installEncryption = (axios: AxiosInstance, encrypt: 'always' | 'signed' | true) => {
  if (encrypt === 'always' || encrypt === true) {
    axios.interceptors.request.use(async (req) => {
      const transformResponse = _.castArray(req.transformResponse)

      const { jwe, secretKey } = await enc.encryptRequest({ body: req.data })

      req.headers.set('x-cypress-encrypted', PUBLIC_KEY_VERSION)
      req.data = jwe
      transformResponse.unshift(async (res, headers) => {
        if (encrypt === 'always' || headers['x-cypress-encrypted'] === 'true') {
          const result = await enc.decryptResponse(JSON.parse(res), secretKey)

          return result
        }

        return res
      })

      req.transformResponse = transformResponse

      return req
    })

    axios.interceptors.response.use(async (res) => {
      res.data = await res.data

      // If we've sent the data back with a signature, ensure we also validate it
      if (res.headers['x-cypress-signature']) {
        await verifySignatureHandler(res)
      }

      return res
    }, async (err) => {
      err.response.data = await err.response.data

      if (err.response.headers['x-cypress-signature']) {
        await verifySignatureHandler(err.response)
      }

      return transformError(err)
    })

    axios.get = function () {
      throw new Error(`Cannot issue GET requests with encryption`)
    }
  }

  if (encrypt === 'signed') {
    axios.interceptors.request.use((req) => {
      req.headers.set('x-cypress-signature', PUBLIC_KEY_VERSION)

      return req
    })

    axios.interceptors.response.use(verifySignatureHandler)
  }
}
