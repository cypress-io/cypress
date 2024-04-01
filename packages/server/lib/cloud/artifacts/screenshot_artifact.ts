import fs from 'fs/promises'
import Debug from 'debug'
import { sendFile } from '../upload/send_file'
import { performance } from 'perf_hooks'
import { Artifact, IArtifact, ArtifactUploadResult } from './artifact'

const debug = Debug('cypress:server:cloud:artifacts:screenshot')

export class ScreenshotArtifact extends Artifact implements IArtifact {
  public readonly reportKey = 'screenshots'

  public static async create (filePath, uploadUrl): Promise<ScreenshotArtifact> {
    const { size: fileSize } = await fs.stat(filePath)

    return new ScreenshotArtifact(filePath, uploadUrl, fileSize)
  }

  public static createBatch (
    screenshotUploadUrls: {screenshotId: string, uploadUrl: string}[],
    screenshotFiles: {screenshotId: string, path: string}[],
  ): Promise<ScreenshotArtifact>[] {
    return screenshotUploadUrls.reduce((acc: Promise<ScreenshotArtifact>[], { screenshotId, uploadUrl }) => {
      const correlatedFilePath = screenshotFiles.find((pathPair) => {
        return pathPair.screenshotId === screenshotId
      })?.path

      debug('correlated filepath: %s', correlatedFilePath)

      return correlatedFilePath ?
        acc.concat(ScreenshotArtifact.create(correlatedFilePath, uploadUrl)) :
        acc
    }, [])
  }

  public async upload (): Promise<ArtifactUploadResult> {
    const startTime = performance.now()

    this.debug('upload starting')
    try {
      const res = await sendFile(this.filePath, this.uploadUrl)

      return this.composeSuccessResult(res, performance.now() - startTime)
    } catch (e) {
      return this.composeFailureResult(e, performance.now() - startTime)
    }
  }
}
