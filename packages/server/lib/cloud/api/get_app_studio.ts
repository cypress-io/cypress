import path from 'path'
import os from 'os'
import { ensureDir, copy, readFile } from 'fs-extra'
import cloudApi from '.'
import { StudioManager } from '../studio'
import tar from 'tar'
import { verifySignatureFromFile } from '../encryption'
import crypto from 'crypto'
import fs from 'fs'
import fetch from 'cross-fetch'
import { agent } from '@packages/network'
import { asyncRetry, linearDelay } from '../../util/async_retry'
import { isRetryableError } from '../network/is_retryable_error'

const pkg = require('@packages/root')
const routes = require('../routes')

const _delay = linearDelay(500)

const studioPath = path.join(os.tmpdir(), 'cypress', 'studio')
const bundlePath = path.join(studioPath, 'bundle.tar')
const serverFilePath = path.join(studioPath, 'server', 'index.js')

const downloadAppStudioBundleToTempDirectory = async (projectId?: string): Promise<void> => {
  let responseSignature: string | null = null

  await (asyncRetry(async () => {
    const response = await fetch(routes.apiRoutes.studio() as string, {
      // @ts-expect-error - this is supported
      agent,
      method: 'GET',
      headers: {
        'x-route-version': '1',
        'x-cypress-signature': cloudApi.publicKeyVersion,
        ...(projectId ? { 'x-cypress-project-slug': projectId } : {}),
        'x-cypress-studio-mount-version': '1',
        'x-os-name': os.platform(),
        'x-cypress-version': pkg.version,
      },
      encrypt: 'signed',
    })

    responseSignature = response.headers.get('x-cypress-signature')

    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(bundlePath)

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

  const verified = await verifySignatureFromFile(bundlePath, responseSignature)

  if (!verified) {
    throw new Error('Unable to verify studio signature')
  }
}

const getTarHash = (): Promise<string> => {
  let hash = ''

  return new Promise<string>((resolve, reject) => {
    fs.createReadStream(bundlePath)
    .pipe(crypto.createHash('sha256'))
    .setEncoding('base64url')
    .on('data', (data) => {
      hash += String(data)
    })
    .on('error', reject)
    .on('close', () => {
      resolve(hash)
    })
  })
}

export const getAppStudio = async (projectId?: string): Promise<StudioManager> => {
  try {
    let script: string
    let studioHash: string | undefined

    // First remove studioPath to ensure we have a clean slate
    await fs.promises.rm(studioPath, { recursive: true, force: true })
    await ensureDir(studioPath)

    // Note: CYPRESS_LOCAL_STUDIO_PATH is stripped from the binary, effectively removing this code path
    if (process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      const appPath = path.join(process.env.CYPRESS_LOCAL_STUDIO_PATH, 'app')
      const serverPath = path.join(process.env.CYPRESS_LOCAL_STUDIO_PATH, 'server')

      await copy(appPath, path.join(studioPath, 'app'))
      await copy(serverPath, path.join(studioPath, 'server'))
    } else {
      await downloadAppStudioBundleToTempDirectory(projectId)

      studioHash = await getTarHash()

      await tar.extract({
        file: bundlePath,
        cwd: studioPath,
      })
    }

    script = await readFile(serverFilePath, 'utf8')

    const appStudio = new StudioManager()

    appStudio.setup({ script, studioPath, studioHash })

    return appStudio
  } catch (error: unknown) {
    let actualError: Error

    if (!(error instanceof Error)) {
      actualError = new Error(String(error))
    } else {
      actualError = error
    }

    return StudioManager.createInErrorManager(actualError)
  }
}
