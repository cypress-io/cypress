import { AxiosInstance, AxiosResponse } from 'axios'
import * as enc from '../../encryption'
import { PUBLIC_KEY_VERSION } from '../../constants'
import { verifySignature } from '../../encryption'
import _ from 'lodash'

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

      return res
    })
  }

  if (encrypt === 'signed') {
    axios.interceptors.request.use((req) => {
      req.headers.set('x-cypress-signature', PUBLIC_KEY_VERSION)

      return req
    })

    axios.interceptors.response.use(async (res: AxiosResponse) => {
      const isVerified = verifySignature(res.data, res.headers['x-cypress-signature'])

      if (!isVerified) {
        throw new Error(`Unable to verify the request signature for ${res.request?.path ?? 'request'}`)
      }

      return res
    })
  }
}
