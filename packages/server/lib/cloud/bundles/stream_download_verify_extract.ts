import { createWriteStream } from 'fs'
import { ensureDir, remove } from 'fs-extra'
import { pipeline } from 'stream/promises'
import { Transform } from 'stream'
import path from 'path'
import os from 'os'
import tar from 'tar'
import fetch from 'cross-fetch'
import Debug from 'debug'
import { strictAgent } from '@packages/network'
import { asyncRetry, linearDelay } from '../../util/async_retry'
import { isRetryableError } from '../network/is_retryable_error'
import { HttpError } from '../network/http_error'
import { SystemError } from '../network/system_error'
import { PUBLIC_KEY_VERSION } from '../constants'
import { createStreamingSignatureVerifier } from '../encryption'
import { BundleError, BundleErrorStage, BundleKind } from './bundle_error'

const pkg = require('@packages/root')

const debug = Debug('cypress:server:cloud:bundles:stream-download-verify-extract')

const FETCH_TIMEOUT_MS = 25000
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 500

interface StreamDownloadVerifyExtractOptions {
  url: string
  projectId?: string
  staging: string
  kind: BundleKind
}

const isInsideDir = (parent: string, child: string): boolean => {
  const rel = path.relative(parent, child)

  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

const buildHeaders = (projectId: string | undefined): Record<string, string> => {
  return {
    'x-route-version': '1',
    'x-cypress-signature': PUBLIC_KEY_VERSION,
    ...(projectId ? { 'x-cypress-project-slug': projectId } : {}),
    'x-os-name': os.platform(),
    'x-cypress-version': pkg.version,
  }
}

// POSIX-style errno codes (ECONNRESET, ETIMEDOUT, EAI_AGAIN, ...).
// Excludes Node's ERR_* codes so a thrown TypeError isn't misclassified.
const isPosixSyscallError = (err: any): boolean => {
  if (err?.errno !== undefined) return true

  const code = err?.code

  if (typeof code !== 'string') return false

  if (code.startsWith('ERR_')) return false

  return /^E[A-Z]/.test(code)
}

// Network-class POSIX codes that can surface mid-pipeline from the response
// body stream (TCP drop, DNS flake, etc.). Everything else syscall-y during
// extract (ENOSPC, EACCES, EROFS, EIO, ...) is a filesystem error from the
// tar-entry write — non-transient, must not be retried.
const NETWORK_SYSCALL_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'EHOSTDOWN',
  'ENETUNREACH',
  'ENETDOWN',
  'ENOTFOUND',
  'EPIPE',
  'EAGAIN',
])

const isNetworkSyscallError = (err: any): boolean => {
  const code = err?.code

  return typeof code === 'string' && NETWORK_SYSCALL_CODES.has(code)
}

// Wraps fetch/pipeline errors as BundleError. `cause` carries the underlying
// HttpError/SystemError so asyncRetry's shouldRetry can classify via
// isRetryableError. `defaultStage` is used when the err has no HTTP/syscall
// shape: 'network' for the fetch phase, 'extract' for the pipeline phase.
const wrapAsBundleError = (
  err: any,
  url: string,
  kind: BundleKind,
  defaultStage: BundleErrorStage,
): BundleError => {
  if (err?.name === 'AbortError') {
    const message = `${kind} bundle fetch timed out after ${FETCH_TIMEOUT_MS}ms`
    const sysError = new SystemError(new Error(message), url, 'ETIMEDOUT', undefined)

    return new BundleError({ kind, stage: 'network', message, cause: sysError })
  }

  if (HttpError.isHttpError(err)) {
    return new BundleError({
      kind,
      stage: 'network',
      message: `${kind} bundle fetch failed with HTTP ${err.status} ${err.statusText ?? ''}`.trim(),
      cause: err,
    })
  }

  if (isPosixSyscallError(err)) {
    if (defaultStage === 'network' || isNetworkSyscallError(err)) {
      const sysError = SystemError.isSystemError(err)
        ? err
        : Object.assign(new SystemError(err, url, err.code, err.errno), { stack: err.stack })

      return new BundleError({
        kind,
        stage: 'network',
        message: `${kind} bundle network error: ${err.message ?? err.code}`,
        cause: sysError,
      })
    }

    return new BundleError({
      kind,
      stage: defaultStage,
      message: `${kind} bundle ${defaultStage} failed: ${err.message ?? err.code}`,
      cause: err,
    })
  }

  return new BundleError({
    kind,
    stage: defaultStage,
    message: `${kind} bundle ${defaultStage} failed: ${err?.message ?? String(err)}`,
    cause: err,
  })
}

const runDownloadAttempt = async ({ url, projectId, staging, kind }: StreamDownloadVerifyExtractOptions): Promise<string> => {
  // Each attempt starts from a clean staging dir so retries can't see
  // partial bytes from the previous attempt.
  await remove(staging).catch(() => { /* ignore */ })
  await ensureDir(staging)

  const verifier = createStreamingSignatureVerifier()
  const tee = new Transform({
    transform (chunk, _enc, cb) {
      verifier.update(chunk)
      cb(null, chunk)
    },
  })

  const parser = new tar.Parse({ strict: true })
  const entryPromises: Promise<void>[] = []

  parser.on('entry', (entry) => {
    if (entry.type !== 'File') {
      entry.resume()

      return
    }

    const targetPath = path.resolve(staging, entry.path)

    if (!isInsideDir(staging, targetPath)) {
      debug('rejecting entry outside staging: %s', entry.path)
      entry.resume()

      return
    }

    const writePromise = (async () => {
      await ensureDir(path.dirname(targetPath))

      const ws = createWriteStream(targetPath, { mode: entry.mode || 0o644 })

      await pipeline(entry, ws)
    })()

    entryPromises.push(writePromise)
  })

  const controller = new AbortController()
  const fetchTimeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let bundleSig: string | null = null
  let manifestSig: string | null = null

  try {
    debug('fetching %s bundle from %s', kind, url)

    let response: Awaited<ReturnType<typeof fetch>>

    try {
      response = await fetch(url, {
        // @ts-expect-error - this is supported
        agent: strictAgent,
        method: 'GET',
        headers: buildHeaders(projectId),
        encrypt: 'signed',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw await HttpError.fromResponse(response)
      }
    } catch (err: any) {
      throw wrapAsBundleError(err, url, kind, 'network')
    }

    bundleSig = response.headers.get('x-cypress-signature')
    manifestSig = response.headers.get('x-cypress-manifest-signature')

    try {
      // @ts-expect-error - response.body is a Node Readable in cross-fetch's Node runtime
      await pipeline(response.body, tee, parser)
      await Promise.all(entryPromises)
    } catch (err: any) {
      // Drain any in-flight entry writes so they don't surface as unhandled
      // rejections after the pipeline has already errored.
      await Promise.allSettled(entryPromises)

      throw wrapAsBundleError(err, url, kind, 'extract')
    }
  } finally {
    clearTimeout(fetchTimeout)
  }

  if (!bundleSig) {
    throw new BundleError({ kind, stage: 'signature', message: `Unable to get ${kind} bundle signature` })
  }

  if (!manifestSig) {
    throw new BundleError({ kind, stage: 'signature', message: `Unable to get ${kind} manifest signature` })
  }

  if (!verifier.verify(bundleSig)) {
    throw new BundleError({ kind, stage: 'signature', message: `Unable to verify ${kind} bundle signature` })
  }

  debug('%s bundle stream verified', kind)

  return manifestSig
}

// All bundle fetches are GET, so pass that through to isRetryableError so it
// retries HTTP 500 in addition to the always-retryable statuses.
const shouldRetryBundleError = (err: unknown): boolean => {
  if (BundleError.isBundleError(err)) {
    const cause = (err as Error & { cause?: unknown }).cause

    return cause !== undefined && isRetryableError(cause, 'GET')
  }

  return isRetryableError(err, 'GET')
}

export const streamDownloadVerifyExtract = async (options: StreamDownloadVerifyExtractOptions): Promise<string> => {
  return asyncRetry(runDownloadAttempt, {
    maxAttempts: MAX_ATTEMPTS,
    retryDelay: linearDelay(RETRY_DELAY_MS),
    shouldRetry: shouldRetryBundleError,
    onRetry: (delayMs, err) => {
      debug('retrying %s bundle download in %dms after error: %o', options.kind, delayMs, err)
    },
  })(options)
}
