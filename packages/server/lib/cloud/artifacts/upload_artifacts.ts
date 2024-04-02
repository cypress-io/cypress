import Debug from 'debug'
import type ProtocolManager from '../protocol'
import api from '../api'
import { logUploadManifest, logUploadResults, beginUploadActivityOutput } from '../../util/print-run'
import type { UpdateInstanceArtifactsPayload, ArtifactMetadata, ProtocolMetadata } from '../api'
import * as errors from '../../errors'
import exception from '../exception'
import type { IArtifact, ArtifactUploadResult } from './artifact'
import { createScreenshotArtifactBatch } from './screenshot_artifact'
import { createVideoArtifact } from './video_artifact'
import { createProtocolArtifact, composeProtocolErrorReportFromOptions } from './protocol_artifact'

const debug = Debug('cypress:server:cloud:artifacts')

const toUploadReportPayload = (acc: {
  screenshots: ArtifactMetadata[]
  video?: ArtifactMetadata
  protocol?: ProtocolMetadata
}, { key, ...report }: ArtifactUploadResult): UpdateInstanceArtifactsPayload => {
  if (key === 'protocol') {
    let { error, errorStack, allErrors } = report

    if (allErrors) {
      error = `Failed to upload Test Replay after ${allErrors.length} attempts. Errors: ${allErrors.map((error) => error.message).join(', ')}`
      errorStack = allErrors.map((error) => error.stack).join(', ')
    } else if (error) {
      error = `Failed to upload Test Replay: ${error}`
    }

    debug('protocol report %O', report)

    return {
      ...acc,
      protocol: {
        ...report,
        error,
        errorStack,
      },
    }
  }

  return {
    ...acc,
    [key]: (key === 'screenshots') ? [...acc.screenshots, report] : report,
  }
}

type UploadArtifactOptions = {
  protocolManager: ProtocolManager
  videoUploadUrl?: string
  video?: string // filepath to the video artifact
  screenshots?: {
    screenshotId: string
    path: string
  }[]
  screenshotUploadUrls?: {
    screenshotId: string
    uploadUrl: string
  }[]
  captureUploadUrl?: string
  protocolCaptureMeta: {
    url?: string
    disabledMessage?: string
  }
  quiet?: boolean
  runId: string
  instanceId: string
  spec: any
  platform: any
  projectId: any
}

const extractArtifactsFromOptions = async ({
  video, videoUploadUrl, screenshots, screenshotUploadUrls, captureUploadUrl, protocolCaptureMeta, protocolManager,
}: Pick<UploadArtifactOptions,
  'video' | 'videoUploadUrl' |
  'screenshots' | 'screenshotUploadUrls' |
  'captureUploadUrl' | 'protocolManager' | 'protocolCaptureMeta'
>): Promise<IArtifact[]> => {
  const artifacts: IArtifact[] = []

  if (videoUploadUrl && video) {
    try {
      artifacts.push(await createVideoArtifact(video, videoUploadUrl))
    } catch (e) {
      debug('Error creating video artifact: %O', e)
    }
  }

  debug('screenshot metadata: %O', { screenshotUploadUrls, screenshots })
  debug('found screenshot filenames: %o', screenshots)
  if (screenshots?.length && screenshotUploadUrls?.length) {
    const screenshotArtifacts = await createScreenshotArtifactBatch(screenshotUploadUrls, screenshots)

    screenshotArtifacts.forEach((screenshot) => {
      artifacts.push(screenshot)
    })
  }

  try {
    const protocolFilePath = protocolManager?.getArchivePath()

    const protocolUploadUrl = captureUploadUrl || protocolCaptureMeta.url

    debug('should add protocol artifact? %o, %o, %O', protocolFilePath, protocolUploadUrl, protocolManager)
    if (protocolManager && protocolFilePath && protocolUploadUrl) {
      artifacts.push(await createProtocolArtifact(protocolFilePath, protocolUploadUrl, protocolManager))
    }
  } catch (e) {
    debug('Error creating protocol artifact: %O', e)
  }

  return artifacts
}

export const uploadArtifacts = async (options: UploadArtifactOptions) => {
  const { protocolManager, protocolCaptureMeta, quiet, runId, instanceId, spec, platform, projectId } = options

  const priority = {
    'video': 0,
    'screenshots': 1,
    'protocol': 2,
  }

  const artifacts = (await extractArtifactsFromOptions(options)).sort((a, b) => {
    return priority[a.reportKey] - priority[b.reportKey]
  })

  let uploadReport: UpdateInstanceArtifactsPayload

  if (!quiet) {
    logUploadManifest(artifacts, protocolCaptureMeta, protocolManager?.getFatalError())
  }

  debug('preparing to upload artifacts: %O', artifacts)

  let stopUploadActivityOutput: () => void | undefined

  if (!quiet && artifacts.length) {
    stopUploadActivityOutput = beginUploadActivityOutput()
  }

  try {
    const uploadResults = await Promise.all(artifacts.map((artifact) => artifact.upload())).finally(() => {
      if (stopUploadActivityOutput) {
        stopUploadActivityOutput()
      }
    })

    /**
     * upload report *stdout* is skipped for *some* fatal protocol runs, but we still
     * want them reported to cloud.
     */

    if (!quiet && uploadResults.length) {
      logUploadResults(uploadResults, protocolManager?.getFatalError())
    }

    const protocolFatalError = protocolManager.getFatalError()

    if (!uploadResults.find((result: ArtifactUploadResult) => {
      return result.key === 'protocol'
    }) && protocolFatalError) {
      uploadResults.push(await composeProtocolErrorReportFromOptions(options))
    }

    uploadReport = uploadResults.reduce(toUploadReportPayload, { video: undefined, screenshots: [], protocol: undefined })
  } catch (err) {
    errors.warning('CLOUD_CANNOT_UPLOAD_ARTIFACTS', err)

    return exception.create(err)
  }

  debug('checking for protocol errors', protocolManager?.hasErrors())
  if (protocolManager) {
    try {
      await protocolManager.reportNonFatalErrors({
        specName: spec.name,
        osName: platform.osName,
        projectSlug: projectId,
      })
    } catch (err) {
      debug('Failed to send protocol errors %O', err)
    }
  }

  try {
    debug('upload report: %O', uploadReport)
    const res = await api.updateInstanceArtifacts({
      runId, instanceId,
    }, uploadReport)

    return res
  } catch (err) {
    debug('failed updating artifact status %o', {
      stack: err.stack,
    })

    errors.warning('CLOUD_CANNOT_UPLOAD_ARTIFACTS_PROTOCOL', err)

    if (err.statusCode !== 503) {
      return exception.create(err)
    }
  }
}
