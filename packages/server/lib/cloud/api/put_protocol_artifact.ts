import fsAsync from 'fs/promises'
import fs from 'fs'
import Debug from 'debug'
import { uploadStream, geometricRetry } from '../upload/upload_stream'
import { StreamActivityMonitor } from '../upload/stream_activity_monitor'

const debug = Debug('cypress:server:cloud:api:protocol-artifact')

// the upload will get canceled if the source stream does not
// begin flowing within 5 seconds, or if the stream pipeline
// stalls (does not push data to the `fetch` sink) for more
// than 5 seconds
const MAX_START_DWELL_TIME = 5000
const MAX_ACTIVITY_DWELL_TIME = 5000

export const putProtocolArtifact = async (artifactPath: string, maxFileSize: number, destinationUrl: string) => {
  debug(`Atttempting to upload Test Replay archive from ${artifactPath} to ${destinationUrl})`)
  const { size } = await fsAsync.stat(artifactPath)

  if (size > maxFileSize) {
    throw new Error(`Spec recording too large: artifact is ${size} bytes, limit is ${maxFileSize} bytes`)
  }

  const activityMonitor = new StreamActivityMonitor(MAX_START_DWELL_TIME, MAX_ACTIVITY_DWELL_TIME)
  const fileStream = fs.createReadStream(artifactPath)

  await uploadStream(
    fileStream,
    destinationUrl,
    size, {
      retryDelay: geometricRetry,
      activityMonitor,
    },
  )
}
