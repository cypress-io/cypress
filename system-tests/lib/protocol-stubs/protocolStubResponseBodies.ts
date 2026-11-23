import path from 'path'
import crypto from 'crypto'
import zlib from 'zlib'
import fs from 'fs-extra'
import { Transform } from 'stream'
import type { AppCaptureProtocolInterface, ResponseEndedWithEmptyBodyOptions, ResponseStreamOptions, ResponseStreamTimedOutOptions } from '@packages/types'
import type { Readable } from 'stream'

const getFilePath = (filename) => {
  return path.join(
    path.resolve(__dirname),
    'cypress',
    'system-tests-protocol-dbs',
    `${filename}.json`,
  )
}

// Only the fixture server's responses are recorded; the runner page loads
// assets of its own through the same session.
const FIXTURE_ORIGIN = 'http://localhost:3232'

type StreamCapture = {
  url: string
  contentEncoding?: string
  isAlreadyGunzipped: boolean
  isAlreadyBrotliDecompressed: boolean
  chunks: Buffer[]
  ended: boolean
  closed: boolean
  error?: string
}

export type RecordedResponseBody = {
  kind: 'stream' | 'emptyBody'
  url: string
  // bytes as the protocol received them, before any decoding the protocol does itself
  receivedBytes?: number
  // bytes after the decoding the real protocol applies for a still-encoded stream
  decodedBytes?: number
  decodedSha256?: string
  isAlreadyGunzipped?: boolean
  contentEncoding?: string
  ended?: boolean
  closed?: boolean
  error?: string
}

const decode = (capture: StreamCapture): Buffer => {
  const body = Buffer.concat(capture.chunks)
  const encoding = capture.contentEncoding ?? ''

  if (encoding.includes('gzip') && !capture.isAlreadyGunzipped) {
    return zlib.gunzipSync(body)
  }

  if (encoding.includes('br') && !capture.isAlreadyBrotliDecompressed) {
    return zlib.brotliDecompressSync(body)
  }

  return body
}

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  private filename: string
  private cdpClient: any
  private urlsByRequestId = new Map<string, string>()
  private streams: StreamCapture[] = []
  private emptyBodies: string[] = []

  getDbMetadata (): { offset: number, size: number } {
    return {
      offset: 0,
      size: 0,
    }
  }

  // Passes every chunk through unchanged: on the materialized path the
  // returned stream is the body the browser receives.
  responseStreamReceived (options: ResponseStreamOptions): Readable {
    const url = this.urlsByRequestId.get(options.requestId)

    if (!url) {
      return options.responseStream
    }

    const contentEncoding = options.responseHeaders['content-encoding']

    const capture: StreamCapture = {
      url,
      contentEncoding: Array.isArray(contentEncoding) ? contentEncoding.join(',') : contentEncoding,
      isAlreadyGunzipped: options.isAlreadyGunzipped,
      isAlreadyBrotliDecompressed: !!options.isAlreadyBrotliDecompressed,
      chunks: [],
      ended: false,
      closed: false,
    }

    this.streams.push(capture)

    const recorder = new Transform({
      transform (chunk, encoding, callback) {
        capture.chunks.push(Buffer.from(chunk))
        callback(null, chunk)
      },
    })

    options.responseStream.once('end', () => {
      capture.ended = true
    })

    options.responseStream.once('close', () => {
      capture.closed = true
    })

    options.responseStream.once('error', (err) => {
      capture.error = err.message
      recorder.destroy(err)
    })

    return options.responseStream.pipe(recorder)
  }

  connectToBrowser = async (cdpClient) => {
    if (cdpClient) {
      this.cdpClient = cdpClient
    }

    await this.cdpClient.send('Network.enable')
    this.cdpClient.on('Network.requestWillBeSent', (params) => {
      if (params.request.url.startsWith(FIXTURE_ORIGIN)) {
        this.urlsByRequestId.set(params.requestId, params.request.url)
      }
    })
  }

  addRunnables = (runnables) => {
    return Promise.resolve()
  }

  beforeSpec = ({ archivePath, db }) => {
    this.filename = getFilePath(path.basename(db.name))

    if (!fs.existsSync(archivePath)) {
      // If a dummy file hasn't been created by the test, write a tar file so that it can be fake uploaded
      fs.writeFileSync(archivePath, '')
    }
  }

  async afterSpec (): Promise<void> {
    const recorded: RecordedResponseBody[] = [
      ...this.streams.map((capture): RecordedResponseBody => {
        const receivedBytes = capture.chunks.reduce((total, chunk) => total + chunk.length, 0)
        let decoded: Buffer | undefined
        let error = capture.error

        try {
          decoded = decode(capture)
        } catch (err) {
          error = `decode failed: ${(err as Error).message}`
        }

        return {
          kind: 'stream',
          url: capture.url,
          receivedBytes,
          decodedBytes: decoded?.length,
          decodedSha256: decoded && crypto.createHash('sha256').update(decoded).digest('hex'),
          isAlreadyGunzipped: capture.isAlreadyGunzipped,
          contentEncoding: capture.contentEncoding,
          ended: capture.ended,
          closed: capture.closed,
          error,
        }
      }),
      ...this.emptyBodies.map((url): RecordedResponseBody => ({ kind: 'emptyBody', url })),
    ]

    try {
      await fs.outputFile(this.filename, JSON.stringify({ recorded }, null, 2))
    } catch (e) {
      console.log('error writing protocol events', e)
    }
  }

  beforeTest = (test) => {
    return Promise.resolve()
  }

  commandLogAdded = (log) => {
  }

  commandLogChanged = (log) => {
  }

  viewportChanged = (input) => {
  }

  urlChanged = (input) => {
  }

  pageLoading = (input) => {
  }

  preAfterTest = (test, options) => {
    return Promise.resolve()
  }

  afterTest = (test) => {
    return Promise.resolve()
  }

  responseEndedWithEmptyBody = (options: ResponseEndedWithEmptyBodyOptions) => {
    const url = this.urlsByRequestId.get(options.requestId)

    if (url) {
      this.emptyBodies.push(url)
    }
  }

  responseStreamTimedOut (options: ResponseStreamTimedOutOptions): void {
  }

  resetTest (testId: string): void {
  }
}
