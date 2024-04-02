import fs from 'fs/promises'
import type { ProtocolManager } from '../protocol'
import { IArtifact, ArtifactUploadStrategy, ArtifactUploadResult, Artifact } from './artifact'

interface ProtocolUploadStrategyResult {
  success: boolean
  fileSize: number | bigint
  specAccess: {
    offset: number
    size: number
  }
}

const createProtocolUploadStrategy = (protocolManager: ProtocolManager) => {
  const strategy: ArtifactUploadStrategy<Promise<ProtocolUploadStrategyResult | {}>> =
    async (filePath, uploadUrl, fileSize) => {
      const fatalError = protocolManager.getFatalError()

      if (fatalError) {
        throw fatalError.error
      }

      const res = await protocolManager.uploadCaptureArtifact({ uploadUrl, fileSize, filePath })

      return res ?? {}
    }

  return strategy
}

export const createProtocolArtifact = async (filePath: string, uploadUrl: string, protocolManager: ProtocolManager): Promise<IArtifact> => {
  const { size } = await fs.stat(filePath)

  return new Artifact('protocol', filePath, uploadUrl, size, createProtocolUploadStrategy(protocolManager))
}

export const composeProtocolErrorReportFromOptions = async ({
  protocolManager,
  protocolCaptureMeta,
  captureUploadUrl,
}: {
  protocolManager?: ProtocolManager
  protocolCaptureMeta?: { url?: string, disabledMessage?: string }
  captureUploadUrl?: string
}): Promise<ArtifactUploadResult> => {
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
