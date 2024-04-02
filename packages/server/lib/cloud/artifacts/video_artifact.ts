import fs from 'fs/promises'
import { Artifact, IArtifact } from './artifact'
import { fileUploadStrategy } from './file_upload_strategy'

export const createVideoArtifact = async (filePath: string, uploadUrl: string): Promise<IArtifact> => {
  const { size } = await fs.stat(filePath)

  return new Artifact('video', filePath, uploadUrl, size, fileUploadStrategy)
}
