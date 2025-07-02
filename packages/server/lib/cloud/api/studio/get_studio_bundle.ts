import { asyncRetry, linearDelay } from '../../../util/async_retry'
import { isRetryableError } from '../../network/is_retryable_error'
import fetch from 'cross-fetch'
import os from 'os'
import { agent } from '@packages/network'
import { PUBLIC_KEY_VERSION } from '../../constants'
import { createWriteStream } from 'fs'
import { verifySignatureFromFile } from '../../encryption'

const pkg = require('@packages/root')
const _delay = linearDelay(500)

export const getStudioBundle = async ({ studioUrl, bundlePath }: { studioUrl: string, bundlePath: string }): Promise<string> => {
  let responseSignature: string | null = null
  let responseManifestSignature: string | null = null

  await (asyncRetry(async () => {
    const response = await fetch(studioUrl, {
      // @ts-expect-error - this is supported
      agent,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': PUBLIC_KEY_VERSION,
        'x-os-name': os.platform(),
        'x-cypress-version': pkg.version,
      },
      encrypt: 'signed',
    })

    if (!response.ok) {
      throw new Error(`Failed to download studio bundle: ${response.statusText}`)
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
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
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

  return responseManifestSignature
}
