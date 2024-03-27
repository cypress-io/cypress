export interface BaseArtifact {
  reportKey: 'video' | 'screenshots' | 'protocol'
  uploadUrl: string
  filePath: string
  fileSize: number | bigint
  upload: () => Promise<ArtifactUploadResult>
}

export type SkippedArtifact = Omit<BaseArtifact, 'uploadUrl' | 'filePath'> & {
  message?: string
  skip: true
}

export function isSkippedArtifact (candidate: any): candidate is SkippedArtifact {
  return !!candidate.skipped
}

export interface PreparedArtifact {
  reportKey: BaseArtifact['reportKey']
  error?: string
  errorStack?: string
  skip?: boolean
  uploadUrl?: string
  filePath?: string
  fileSize?: number | bigint
}

export interface ArtifactUploadResult {
  success: boolean
  error?: Error | string
  url: string
  pathToFile: string
  fileSize: number | bigint
  key: BaseArtifact['reportKey']
  skipped?: boolean
  errorStack?: string
  allErrors?: Error[]
  specAccess?: {
    offset: number
    size: number
  }
  uploadDuration: number
}
