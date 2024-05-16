import fs from 'fs/promises'
import { existsSync } from 'fs'
import type { ProtocolManager } from '../protocol'
import { IArtifact, ArtifactUploadStrategy, ArtifactUploadResult, Artifact, ArtifactKinds } from './artifact'
import Debug from 'debug'
const debug = Debug('cypress:server:cloud:artifacts:protocol')

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

export const createProtocolArtifact = async (filePath: string, uploadUrl: string, protocolManager: ProtocolManager): Promise<IArtifact | undefined> => {
  let size: number | undefined

  debug('statting file path', filePath)
  try {
    const stat = await fs.stat(filePath)

    debug('file stat', stat)
    size = stat.size
  } catch (e) {
    debug('failed to stat protocol artifact filepath: ', e)
    protocolManager.addFatalError('uploadCaptureArtifact', new Error(`File not found: ${filePath}`))
  }

  return size !== undefined ? new Artifact('protocol', filePath, uploadUrl, size, createProtocolUploadStrategy(protocolManager)) : undefined
}

export const composeProtocolErrorReportFromOptions = async ({
  protocolManager,
  protocolCaptureMeta,
  captureUploadUrl,
}: {
  protocolManager?: ProtocolManager
  protocolCaptureMeta: { url?: string, disabledMessage?: string }
  captureUploadUrl?: string
}): Promise<ArtifactUploadResult> => {
  const url = captureUploadUrl || protocolCaptureMeta.url
  const pathToFile = protocolManager?.getArchivePath()
  const fileSize = pathToFile && existsSync(pathToFile) ? (await fs.stat(pathToFile))?.size : 0

  const fatalError = protocolManager?.getFatalError()

  debug('fatalError via composeProtocolErrorReport', fatalError)

  return {
    key: ArtifactKinds.PROTOCOL,
    url: url ?? 'UNKNOWN',
    pathToFile: pathToFile ?? 'UNKNOWN',
    fileSize,
    success: false,
    error: fatalError?.error.message || 'UNKNOWN',
    errorStack: fatalError?.error.stack || 'UNKNOWN',
  }
}
