export type Artifact = {
  reportKey: 'protocol' | 'screenshots' | 'video'
  uploadUrl?: string
  filePath?: string
  url?: string
  fileSize?: number | bigint
  payload?: Buffer
  message?: string
  skip?: boolean
  error?: string
}

export type ArtifactUploadResult = Pick<Artifact, 'fileSize' | 'url'> & {
  success: boolean
  error?: string
  pathToFile: string
  key: Artifact['reportKey']
}
