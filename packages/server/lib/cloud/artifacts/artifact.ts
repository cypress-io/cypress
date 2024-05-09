import Debug from 'debug'
import { performance } from 'perf_hooks'
import type { AfterSpecDurations } from '@packages/types'
const debug = Debug('cypress:server:cloud:artifact')

const isAggregateError = (err: any): err is AggregateError => {
  return !!err.errors
}

export const ArtifactKinds = Object.freeze({
  VIDEO: 'video',
  SCREENSHOTS: 'screenshots',
  PROTOCOL: 'protocol',
})

type ArtifactKind = typeof ArtifactKinds[keyof typeof ArtifactKinds]

export interface IArtifact {
  reportKey: ArtifactKind
  uploadUrl: string
  filePath: string
  fileSize: number | bigint
  upload: () => Promise<ArtifactUploadResult>
}

export interface ArtifactUploadResult {
  success: boolean
  error?: Error | string
  url: string
  pathToFile: string
  fileSize?: number | bigint
  key: ArtifactKind
  errorStack?: string
  allErrors?: Error[]
  uploadDuration?: number
  originalError?: Error
  afterSpecDurations?: AfterSpecDurations & {
    afterSpecTotal: number
  }
  specAccess?: {
    offset: number
    size: number
  }
}

export type ArtifactUploadStrategy<T> = (filePath: string, uploadUrl: string, fileSize: number | bigint) => T

export class Artifact<T extends ArtifactUploadStrategy<UploadResponse>, UploadResponse extends Promise<any> = Promise<{}>> {
  constructor (
    public reportKey: ArtifactKind,
    public readonly filePath: string,
    public readonly uploadUrl: string,
    public readonly fileSize: number | bigint,
    private uploadStrategy: T,
  ) {
  }

  public async upload (): Promise<ArtifactUploadResult> {
    const startTime = performance.now()

    this.debug('upload starting')

    try {
      const response = await this.uploadStrategy(this.filePath, this.uploadUrl, this.fileSize)

      this.debug('upload succeeded: %O', response)

      return this.composeSuccessResult(response ?? {}, performance.now() - startTime)
    } catch (e) {
      this.debug('upload failed: %O', e)

      return this.composeFailureResult(e, performance.now() - startTime)
    }
  }

  private debug (formatter: string = '', ...args: (string | object | number)[]) {
    if (!debug.enabled) return

    debug(`%s: %s -> %s (%dB) ${formatter}`, this.reportKey, this.filePath, this.uploadUrl, this.fileSize, ...args)
  }

  private commonResultFields (): Pick<ArtifactUploadResult, 'url' | 'pathToFile' | 'fileSize' | 'key'> {
    return {
      key: this.reportKey,
      url: this.uploadUrl,
      pathToFile: this.filePath,
      fileSize: this.fileSize,
    }
  }

  protected composeSuccessResult<T extends Object = {}> (response: T, uploadDuration: number): ArtifactUploadResult {
    return {
      ...response,
      ...this.commonResultFields(),
      success: true,
      uploadDuration,
    }
  }

  protected composeFailureResult<T extends Error> (err: T, uploadDuration: number): ArtifactUploadResult {
    const errorReport = isAggregateError(err) ? {
      error: err.errors[err.errors.length - 1].message,
      errorStack: err.errors[err.errors.length - 1].stack,
      allErrors: err.errors,
    } : {
      error: err.message,
      errorStack: err.stack,
    }

    return {
      ...errorReport,
      ...this.commonResultFields(),
      success: false,
      uploadDuration,
      originalError: err,
    }
  }
}
