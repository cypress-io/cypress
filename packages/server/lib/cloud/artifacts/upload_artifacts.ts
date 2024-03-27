import chalk from 'chalk'
import Debug from 'debug'
import type ProtocolManager from '../protocol'
import api from '../api/api'
import terminal from '../../util/terminal'
import { printPendingArtifactUpload, printCompletedArtifactUpload, beginUploadActivityOutput } from '../../util/print-run'
import type { UpdateInstanceArtifactsPayload, ArtifactMetadata, ProtocolMetadata } from '../api/api'
import * as errors from '../../errors'
import exception from '../exception'
import { ScreenshotArtifact } from './screenshot_artifact'
import { VideoArtifact } from './video_artifact'
import { ProtocolArtifact } from './protocol_artifact'
import {
  BaseArtifact, PreparedArtifact, ArtifactUploadResult,
} from './types'

const debug = Debug('cypress:server:cloud:artifact:upload')

const logUploadManifest = (artifacts: PreparedArtifact[]) => {
  const labels = {
    'video': 'Video',
    'screenshots': 'Screenshot',
    'protocol': 'Test Replay',
  }

  // eslint-disable-next-line no-console
  console.log('')
  terminal.header('Uploading Cloud Artifacts', {
    color: ['blue'],
  })

  // eslint-disable-next-line no-console
  console.log('')

  artifacts.forEach((artifact) => {
    printPendingArtifactUpload(artifact, labels)
  })
}

const logUploadResults = (results: ArtifactUploadResult[]) => {
  const labels = {
    'video': 'Video',
    'screenshots': 'Screenshot',
    'protocol': 'Test Replay',
  }

  // eslint-disable-next-line no-console
  console.log('')

  terminal.header('Uploaded Cloud Artifacts', {
    color: ['blue'],
  })

  // eslint-disable-next-line no-console
  console.log('')

  results.forEach(({ key, skipped, ...report }, i, { length }) => {
    printCompletedArtifactUpload({ key, ...report }, labels, chalk.grey(`${i + 1}/${length}`))
  })
}

const toUploadReportPayload = (acc: {
  screenshots: ArtifactMetadata[]
  video?: ArtifactMetadata
  protocol?: ProtocolMetadata
}, { key, skipped, ...report }: ArtifactUploadResult): UpdateInstanceArtifactsPayload => {
  if (key === 'protocol') {
    let { error, errorStack, allErrors } = report

    if (allErrors) {
      error = `Failed to upload Test Replay after ${allErrors.length} attempts. Errors: ${allErrors.map((error) => error.message).join(', ')}`
      errorStack = allErrors.map((error) => error.stack).join(', ')
    } else if (error) {
      error = `Failed to upload Test Replay: ${error}`
    }

    return skipped && !report.error ? acc : {
      ...acc,
      protocol: {
        ...report,
        error,
        errorStack,
      },
    }
  }

  return skipped ? acc : {
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
>): Promise<BaseArtifact[]> => {
  const artifacts: BaseArtifact[] = []

  if (videoUploadUrl && video) {
    artifacts.push(await VideoArtifact.create(video, videoUploadUrl))
  }
  // TODO: what if video artifact creation throws?

  if (screenshotUploadUrls?.length && screenshots?.length) {
    const screenshotArtifacts = await Promise.all(ScreenshotArtifact.createBatch(screenshotUploadUrls, screenshots))

    // TODO:  what if screenshot artifact creation throws?
    screenshotArtifacts.forEach((artifact) => {
      artifacts.push(artifact)
    })
  }

  debug('capture manifest: %O', { captureUploadUrl, protocolCaptureMeta, protocolManager })
  const protocolFilePath = protocolManager?.getArchivePath()

  const protocolUploadUrl = captureUploadUrl || protocolCaptureMeta.url

  if (protocolManager && protocolFilePath && protocolUploadUrl) {
    artifacts.push(await ProtocolArtifact.create(protocolFilePath, protocolUploadUrl, protocolManager))
    // TODO: what if protocol artifact creation fails?
  }

  return artifacts
}

export const uploadArtifacts = async (options: UploadArtifactOptions) => {
  const { protocolManager, quiet, runId, instanceId, spec, platform, projectId } = options

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
    logUploadManifest(artifacts)
  }

  debug('preparing to upload artifacts: %O', artifacts)

  let stopUploadActivityOutput: () => void | undefined

  if (!quiet && artifacts.length) {
    stopUploadActivityOutput = beginUploadActivityOutput()
  }

  try {
    //uploadReport = await uploadArtifactBatch(artifacts, quiet)
    const uploadResults = await Promise.all(artifacts.map((artifact) => artifact.upload())).finally(() => {
      if (stopUploadActivityOutput) {
        stopUploadActivityOutput()
      }
    })

    logUploadResults(uploadResults)

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
