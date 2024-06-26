import fsAsync from 'fs/promises'
import fs from 'fs'
import Debug from 'debug'
import { StreamActivityMonitor } from '../upload/stream_activity_monitor'
import { asyncRetry, linearDelay } from '../../util/async_retry'
import { putFetch, ParseKinds } from '../network/put_fetch'
import { isRetryableError } from '../network/is_retryable_error'
const debug = Debug('cypress:server:cloud:api:protocol-artifact')

// the upload will get canceled if the source stream does not
// begin flowing within 5 seconds, or if the stream pipeline
// stalls (does not push data to the `fetch` sink) for more
// than 5 seconds
const MAX_START_DWELL_TIME = 5000
const MAX_ACTIVITY_DWELL_TIME = 5000

export const _delay = linearDelay(500)

export const putProtocolArtifact = asyncRetry(
  async (artifactPath: string, maxFileSize: number, destinationUrl: string) => {
    debug(`Atttempting to upload Test Replay archive from ${artifactPath} to ${destinationUrl})`)
    const { size } = await fsAsync.stat(artifactPath)

    if (size > maxFileSize) {
      throw new Error(`Spec recording too large: artifact is ${size} bytes, limit is ${maxFileSize} bytes`)
    }

    const activityMonitor = new StreamActivityMonitor(MAX_START_DWELL_TIME, MAX_ACTIVITY_DWELL_TIME)
    const fileStream = fs.createReadStream(artifactPath)
    const controller = activityMonitor.getController()

    await putFetch(destinationUrl, {
      parse: ParseKinds.TEXT,
      headers: {
        'content-length': String(size),
        'content-type': 'application/x-tar',
        'accept': 'application/json',
      },
      // ts thinks this is a web fetch, which only expects ReadableStreams.
      // But, this is a node fetch, which supports ReadStreams.
      // @ts-expect-error
      body: activityMonitor.monitor(fileStream),
      signal: controller.signal,
    })
  }, {
    maxAttempts: 3,
    retryDelay: _delay,
    shouldRetry: isRetryableError,
  },
)
