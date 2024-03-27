import fs from 'fs/promises'
import { performance } from 'perf_hooks'
import type { BaseArtifact } from './types'
import type { ProtocolManager } from '../protocol'
import { Artifact } from './artifact'

export class ProtocolArtifact extends Artifact implements BaseArtifact {
  public readonly reportKey = 'protocol'

  constructor (public readonly filePath: string, public readonly uploadUrl: string, fileSize: number | bigint, private protocolManager: ProtocolManager) {
    super(filePath, uploadUrl, fileSize)
  }

  public async upload () {
    const startTime = performance.now()

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
}
