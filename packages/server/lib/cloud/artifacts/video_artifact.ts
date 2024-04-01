import fs from 'fs/promises'
import { performance } from 'perf_hooks'
import { sendFile } from '../upload/send_file'
import { Artifact, IArtifact, ArtifactUploadResult } from './artifact'

export class VideoArtifact extends Artifact implements IArtifact {
  public readonly reportKey = 'video'
  static async create (filePath: string, uploadUrl: string): Promise<VideoArtifact> {
    const { size: fileSize } = await fs.stat(filePath)

    return new VideoArtifact(filePath, uploadUrl, fileSize)
  }
  public async upload (): Promise<ArtifactUploadResult> {
    const startTime = performance.now()

    this.debug('upload starting')
    try {
      const response = await sendFile(this.filePath, this.uploadUrl)

      return this.composeSuccessResult(response, performance.now() - startTime)
    } catch (e) {
      return this.composeFailureResult(e, performance.now() - startTime)
    }
  }
}
