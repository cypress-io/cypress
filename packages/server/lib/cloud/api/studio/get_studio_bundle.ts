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

export const getStudioBundle = async ({ studioUrl, projectId, bundlePath }: { studioUrl: string, projectId?: string, bundlePath: string }) => {
  let responseSignature: string | null = null

  await (asyncRetry(async () => {
    const controller = new AbortController()
    const fetchTimeout = setTimeout(() => {
      controller.abort()
    }, 25000)

    try {
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
        signal: controller.signal,
      })

      clearTimeout(fetchTimeout)

      if (!response.ok) {
        throw new Error(`Failed to download studio bundle: ${response.statusText}`)
      }

      responseSignature = response.headers.get('x-cypress-signature')

      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(bundlePath)
        let pipeTimeout: NodeJS.Timeout

        const cleanup = () => {
          clearTimeout(pipeTimeout)
          writeStream.destroy()
        }

        pipeTimeout = setTimeout(() => {
          cleanup()
          reject(new Error('Studio bundle pipe operation timed out'))
        }, 20000)

        writeStream.on('error', (err) => {
          cleanup()
          reject(err)
        })

        writeStream.on('finish', () => {
          clearTimeout(pipeTimeout)
          resolve()
        })

        // @ts-expect-error - this is supported
        response.body?.pipe(writeStream)
      })
    } catch (error) {
      clearTimeout(fetchTimeout)
      if (error.name === 'AbortError') {
        throw new Error('Studio bundle fetch timed out')
      }

      throw error
    }
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  }))()

  if (!responseSignature) {
    throw new Error('Unable to get studio signature')
  }

  const verified = await verifySignatureFromFile(bundlePath, responseSignature)

  if (!verified) {
    throw new Error('Unable to verify studio signature')
  }
}
