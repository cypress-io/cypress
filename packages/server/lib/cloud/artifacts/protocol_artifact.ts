import fs from 'fs/promises'
import { performance } from 'perf_hooks'
import type { ProtocolManager } from '../protocol'
import { Artifact, IArtifact, ArtifactUploadResult } from './artifact'

export class ProtocolArtifact extends Artifact implements IArtifact {
  public readonly reportKey = 'protocol'

  constructor (public readonly filePath: string, public readonly uploadUrl: string, fileSize: number | bigint, private protocolManager: ProtocolManager) {
    super(filePath, uploadUrl, fileSize)
  }

  public async upload () {
    const startTime = performance.now()
    const fatalCaptureError = this.protocolManager.getFatalError()

    if (fatalCaptureError) {
      return this.composeFailureResult(fatalCaptureError.error, performance.now() - startTime)
    }

    this.debug('upload starting')
    try {
      const res = await this.protocolManager.uploadCaptureArtifact(this)

      /**
     * uploadCaptureArtifact has gating on executing the upload based on some internal
     * values, so res can be undefined - this parameter having to be defaulted to {}
     * is a code smell that can be resolved by fixing protocolmanager
     */
      return this.composeSuccessResult(res ?? {}, performance.now() - startTime)
    } catch (e) {
      return this.composeFailureResult(e, performance.now() - startTime)
    }
  }

  static async create (filePath: string, uploadUrl: string, protocolManager: ProtocolManager): Promise<ProtocolArtifact> {
    const { size: fileSize } = await fs.stat(filePath)

    return new ProtocolArtifact(filePath, uploadUrl, fileSize, protocolManager)
  }

  static async errorReportFromOptions ({
    protocolManager,
    protocolCaptureMeta,
    captureUploadUrl,
  }: {
    protocolManager?: ProtocolManager
    protocolCaptureMeta?: { url?: string, disabledMessage?: string }
    captureUploadUrl?: string
  }): Promise<ArtifactUploadResult> {
    const url = captureUploadUrl || protocolCaptureMeta?.url
    const pathToFile = protocolManager?.getArchivePath()
    const fileSize = pathToFile ? (await fs.stat(pathToFile))?.size : 0

    const fatalError = protocolManager?.getFatalError()

    return {
      key: 'protocol',
      url: url ?? 'UNKNOWN',
      pathToFile: pathToFile ?? 'UNKNOWN',
      fileSize,
      success: false,
      error: fatalError?.error.message || 'UNKNOWN',
      errorStack: fatalError?.error.stack || 'UNKNOWN',
    }
  }
}
