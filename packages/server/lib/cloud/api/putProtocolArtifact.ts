import fsAsync from 'fs/promises'
import fs from 'fs'

import { uploadStream, geometricRetry } from '../upload/uploadStream'
import { StreamActivityMonitor } from '../upload/StreamActivityMonitor'

export const putProtocolArtifact = async (artifactPath: string, maxFileSize: number, destinationUrl: string) => {
  const { size } = await fsAsync.stat(artifactPath)

  if (size > maxFileSize) {
    throw new Error(`Spec recording too large: artifact is ${size} bytes, limit is ${maxFileSize} bytes`)
  }

  const activityMonitor = new StreamActivityMonitor(5000, 5000)
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
