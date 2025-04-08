import fs from 'fs/promises'
import Debug from 'debug'
import { Artifact, IArtifact, ArtifactKinds } from './artifact'
import { fileUploadStrategy } from './file_upload_strategy'

const debug = Debug('cypress:server:cloud:artifacts:screenshot')

const createScreenshotArtifact = async (filePath: string, uploadUrl: string): Promise<IArtifact | undefined> => {
  try {
    const { size } = await fs.stat(filePath)

    return new Artifact(ArtifactKinds.SCREENSHOTS, filePath, uploadUrl, size, fileUploadStrategy)
  } catch (e) {
    debug('Error creating screenshot artifact: %O', e)

    return
  }
}

export const createScreenshotArtifactBatch = (
  screenshotUploadUrls: {screenshotId: string, uploadUrl: string}[],
  screenshotFiles: {screenshotId: string, path: string}[],
): Promise<IArtifact[]> => {
  const correlatedPaths = screenshotUploadUrls.map(({ screenshotId, uploadUrl }) => {
    const correlatedFilePath = screenshotFiles.find((pathPair) => {
      return pathPair.screenshotId === screenshotId
    })?.path

    return correlatedFilePath ? {
      filePath: correlatedFilePath,
      uploadUrl,
    } : undefined
  }).filter((pair): pair is { filePath: string, uploadUrl: string } => {
    return !!pair
  })

  return Promise.all(correlatedPaths.map(({ filePath, uploadUrl }) => {
    return createScreenshotArtifact(filePath, uploadUrl)
  })).then((artifacts) => {
    return artifacts.filter((artifact): artifact is IArtifact => {
      return !!artifact
    })
  })
}
