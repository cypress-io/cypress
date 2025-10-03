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

const pkg = require('@packages/root')
const _delay = linearDelay(500)

export const getCyPromptBundle = async ({ cyPromptUrl, projectId, bundlePath }: { cyPromptUrl: string, projectId?: string, bundlePath: string }): Promise<string> => {
  let responseSignature: string | null = null
  let responseManifestSignature: string | null = null

  await (asyncRetry(async () => {
    try {
      const response = await fetch(cyPromptUrl, {
        // @ts-expect-error - this is supported
        agent: strictAgent,
        method: 'GET',
        headers: {
          'x-route-version': '1',
          'x-cypress-signature': PUBLIC_KEY_VERSION,
          ...(projectId ? { 'x-cypress-project-slug': projectId } : {}),
          'x-cypress-cy-prompt-mount-version': '1',
          'x-os-name': os.platform(),
          'x-cypress-version': pkg.version,
        },
        encrypt: 'signed',
      })

      if (!response.ok) {
        const err = await HttpError.fromResponse(response)

        throw err
      }

      responseSignature = response.headers.get('x-cypress-signature')
      responseManifestSignature = response.headers.get('x-cypress-manifest-signature')

      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(bundlePath)

        writeStream.on('error', reject)
        writeStream.on('finish', () => {
          resolve()
        })

        // @ts-expect-error - this is supported
        response.body?.pipe(writeStream)
      })
    } catch (error) {
      if (HttpError.isHttpError(error)) {
        throw error
      }

      if (error.errno || error.code) {
        const sysError = new SystemError(error, cyPromptUrl, error.code, error.errno)

        sysError.stack = error.stack
        throw sysError
      }

      throw error
    }
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  }))()

  if (!responseSignature) {
    throw new Error('Unable to get cy-prompt signature')
  }

  if (!responseManifestSignature) {
    throw new Error('Unable to get cy-prompt manifest signature')
  }

  const verified = await verifySignatureFromFile(bundlePath, responseSignature)

  if (!verified) {
    throw new Error('Unable to verify cy-prompt signature')
  }

  return responseManifestSignature
}
