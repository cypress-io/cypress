import fs from 'fs/promises'
import { Artifact, IArtifact, ArtifactKinds } from './artifact'
import { fileUploadStrategy } from './file_upload_strategy'

export const createVideoArtifact = async (filePath: string, uploadUrl: string): Promise<IArtifact> => {
  const { size } = await fs.stat(filePath)

  return new Artifact(ArtifactKinds.VIDEO, filePath, uploadUrl, size, fileUploadStrategy)
}
