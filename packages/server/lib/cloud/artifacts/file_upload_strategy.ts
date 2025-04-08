import { sendFile } from '../upload/send_file'
import type { ArtifactUploadStrategy } from './artifact'

export const fileUploadStrategy: ArtifactUploadStrategy<Promise<any>> = (filePath, uploadUrl) => {
  return sendFile(filePath, uploadUrl)
}
