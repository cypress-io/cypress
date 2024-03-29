import Debug from 'debug'

import type { ArtifactUploadResult } from './types'

const debug = Debug('cypress:server:cloud:artifact')

const isAggregateError = (err: any): err is AggregateError => {
  return !!err.errors
}

export abstract class Artifact {
  public abstract reportKey: 'protocol' | 'screenshots' | 'video'

  constructor (
    public readonly filePath: string,
    public readonly uploadUrl: string,
    public readonly fileSize: number | bigint,
  ) {
  }

  protected debug (formatter: string = '', ...args: (string | object | number)[]) {
    if (!debug.enabled) return

    debug(`%s: %s -> %$s (%dB) ${formatter}`, this.reportKey, this.filePath, this.uploadUrl, this.fileSize, ...args)
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
    this.debug('upload success')

    return {
      ...response,
      ...this.commonResultFields(),
      success: true,
      uploadDuration,
    }
  }

  protected composeFailureResult<T extends Error> (err: T, uploadDuration: number): ArtifactUploadResult {
    debug('upload failed %O', err)
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
    }
  }
}
