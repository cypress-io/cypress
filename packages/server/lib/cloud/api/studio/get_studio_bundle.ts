import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import fetch from 'cross-fetch'
import os from 'os'
import { strictAgent } from '@packages/network'
import { PUBLIC_KEY_VERSION } from '../../constants'
import { createWriteStream } from 'fs'
import { verifySignatureFromFile } from '../../encryption'
import { HttpError } from '../../network/http_error'
import { SystemError } from '../../network/system_error'
import Debug from 'debug'

const pkg = require('@packages/root')
const _delay = linearDelay(500)
const debug = Debug('cypress:server:cloud:api:studio:get_studio_bundle')

const DEFAULT_TIMEOUT = 25000

export const getStudioBundle = async ({ studioUrl, bundlePath }: { studioUrl: string, bundlePath: string }): Promise<string> => {
  let responseSignature: string | null = null
  let responseManifestSignature: string | null = null

  await (asyncRetry(async () => {
    const controller = new AbortController()
    const fetchTimeout = setTimeout(() => {
      controller.abort()
    }, DEFAULT_TIMEOUT)

    try {
      debug('Fetching studio bundle from %s', studioUrl)

      const response = await fetch(studioUrl, {
        // @ts-expect-error - this is supported
        agent: strictAgent,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': PUBLIC_KEY_VERSION,
          'x-os-name': os.platform(),
          'x-cypress-version': pkg.version,
        },
        encrypt: 'signed',
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await HttpError.fromResponse(response)

        throw err
      }

      responseSignature = response.headers.get('x-cypress-signature')
      responseManifestSignature = response.headers.get('x-cypress-manifest-signature')

      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(bundlePath)

        writeStream.on('error', (err) => {
          writeStream.destroy()
          reject(err)
        })

        writeStream.on('finish', () => {
          resolve()
        })

        // @ts-expect-error - this is supported
        response.body?.pipe(writeStream)
      })

      // Check if the operation was aborted due to timeout
      if (controller.signal.aborted) {
        throw new Error('Studio bundle fetch timed out')
      }

      clearTimeout(fetchTimeout)
    } catch (error) {
      debug('Error fetching studio bundle from %s: %o', studioUrl, error)

      clearTimeout(fetchTimeout)

      if (error.name === 'AbortError') {
        throw new Error('Studio bundle fetch timed out')
      }

      if (HttpError.isHttpError(error)) {
        throw error
      }

      if (error.errno || error.code) {
        const sysError = new SystemError(error, studioUrl, error.code, error.errno)

        sysError.stack = error.stack
        throw sysError
      }

      throw error
    }
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: (err) => isRetryableError(err, 'GET'),
  }))()

  if (!responseSignature) {
    throw new Error('Unable to get studio signature')
  }

  if (!responseManifestSignature) {
    throw new Error('Unable to get studio manifest signature')
  }

  const verified = await verifySignatureFromFile(bundlePath, responseSignature)

  if (!verified) {
    throw new Error('Unable to verify studio signature')
  }

  debug('Studio bundle fetched successfully from %s', studioUrl)

  return responseManifestSignature
}
