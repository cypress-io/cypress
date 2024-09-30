import _ from 'lodash'
import Debug from 'debug'
import type ProtocolManager from '../protocol'
import { isProtocolInitializationError } from '@packages/types'
import api from '../api'
import { logUploadManifest, logUploadResults, beginUploadActivityOutput } from '../../util/print-run'
import type { UpdateInstanceArtifactsPayload, ArtifactMetadata, ProtocolMetadata } from '../api'
import * as errors from '../../errors'
import exception from '../exception'
import { IArtifact, ArtifactUploadResult, ArtifactKinds } from './artifact'
import { createScreenshotArtifactBatch } from './screenshot_artifact'
import { createVideoArtifact } from './video_artifact'
import { createProtocolArtifact, composeProtocolErrorReportFromOptions } from './protocol_artifact'
import { HttpError } from '../network/http_error'
import { printProtocolUploadError } from './print_protocol_upload_error'

const debug = Debug('cypress:server:cloud:artifacts')

const removeWhitespaceAndTrim = (str: string) => {
  return str.split(/\n/)
  .map((line) => {
    return line.trim()
  })
  .join('')
}

const toUploadReportPayload = (acc: {
  screenshots: ArtifactMetadata[]
  video?: ArtifactMetadata
  protocol?: ProtocolMetadata
}, { key, ...report }: ArtifactUploadResult): UpdateInstanceArtifactsPayload => {
  const reportWithoutOriginalError = _.omit(report, 'originalError')

  if (key === ArtifactKinds.PROTOCOL) {
    let { error, errorStack, allErrors } = reportWithoutOriginalError

    if (allErrors) {
      const messages = allErrors.map((error) => {
        return (HttpError.isHttpError(error) && error.responseBody) ?
      `${error.message}: ${removeWhitespaceAndTrim(error.responseBody)}` :
          error.message
      })

      error = `Failed to upload Test Replay after ${allErrors.length} attempts. Errors: ${messages.join(', ')}`
      errorStack = allErrors.map((error) => error.stack).join('')
    } else if (error) {
      error = `Failed to upload Test Replay: ${error}`
    }

    debug('protocol report %O', reportWithoutOriginalError)

    return {
      ...acc,
      protocol: {
        ...reportWithoutOriginalError,
        error,
        errorStack,
      },
    }
  }

  return {
    ...acc,
    [key]: (key === 'screenshots') ? [...acc.screenshots, reportWithoutOriginalError] : reportWithoutOriginalError,
  }
}

type UploadArtifactOptions = {
  protocolManager?: ProtocolManager
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

    const shouldAddProtocolArtifact = protocolManager && protocolFilePath && captureUploadUrl && !protocolManager.hasFatalError()

    debug('should add protocol artifact? %o', {
      protocolFilePath,
      captureUploadUrl,
      protocolManager: !!protocolManager,
      fatalError: protocolManager?.hasFatalError(),
      shouldAddProtocolArtifact,
    })

    if (shouldAddProtocolArtifact) {
      const protocolArtifact = await createProtocolArtifact(protocolFilePath, captureUploadUrl, protocolManager)

      debug(protocolArtifact)
      if (protocolArtifact) {
        artifacts.push(protocolArtifact)
      }
    } else if (protocolCaptureMeta.url && !captureUploadUrl) {
      const err = new Error('Invalid or missing Test Replay upload URL')

      protocolManager?.addFatalError('protocolUploadUrl', err)
    }
  } catch (e) {
    debug('Error creating protocol artifact: %O', e)
  }

  return artifacts
}

export const uploadArtifacts = async (options: UploadArtifactOptions) => {
  const { protocolManager, protocolCaptureMeta, quiet, runId, instanceId, spec, platform, projectId } = options

  const priority = {
    [ArtifactKinds.VIDEO]: 0,
    [ArtifactKinds.SCREENSHOTS]: 1,
    [ArtifactKinds.PROTOCOL]: 2,
  }

  // Checking protocol fatal errors here, because if there is no fatal error
  // but protocol is enabled and there is no archive path, we want to detect
  // and establish a fatal error
  const preArtifactExtractionFatalError = protocolManager?.getFatalError()

  /**
   * sometimes, protocolManager initializes both without an archive path and without recording an internal
   * fatal error. Test Replay initialization should be refactored in order to capture this state more appropriately.
   */
  debug({
    archivePath: protocolManager?.getArchivePath(),
    protocolManager: !!protocolManager,
    preArtifactExtractionFatalError,
    protocolCaptureMeta,
  })

  if (protocolManager && (!protocolManager.getArchivePath() && !preArtifactExtractionFatalError && !protocolCaptureMeta.disabledMessage && protocolCaptureMeta.url)) {
    protocolManager.addFatalError('UNKNOWN', new Error('Unable to determine Test Replay archive location'))
  }

  const artifacts = (await extractArtifactsFromOptions(options)).sort((a, b) => {
    return priority[a.reportKey] - priority[b.reportKey]
  })

  let uploadReport: UpdateInstanceArtifactsPayload = { video: undefined, screenshots: [], protocol: undefined }

  const postArtifactExtractionFatalError = protocolManager?.getFatalError()

  if (postArtifactExtractionFatalError) {
    if (postArtifactExtractionFatalError.captureMethod === 'protocolUploadUrl') {
      errors.warning('CLOUD_PROTOCOL_CANNOT_UPLOAD_ARTIFACT', postArtifactExtractionFatalError.error)
    } else if (isProtocolInitializationError(postArtifactExtractionFatalError)) {
      errors.warning('CLOUD_PROTOCOL_INITIALIZATION_FAILURE', postArtifactExtractionFatalError.error)
    } else {
      errors.warning('CLOUD_PROTOCOL_CAPTURE_FAILURE', postArtifactExtractionFatalError.error)
    }
  }

  if (!quiet) {
    debug('logging upload manifest: %O', {
      artifacts,
      protocolCaptureMeta,
      fatalProtocolError: protocolManager?.getFatalError(),
    })

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

    if (!quiet && uploadResults.length) {
      logUploadResults(uploadResults, protocolManager?.getFatalError())
    }

    const postUploadProtocolFatalError = protocolManager?.getFatalError()

    if (postUploadProtocolFatalError && postUploadProtocolFatalError.captureMethod === 'uploadCaptureArtifact') {
      const error = postUploadProtocolFatalError.error

      printProtocolUploadError(error)
    }

    // there is no upload results entry for protocol if we did not attempt to upload protocol due to a fatal error
    // during initialization or capture. however, we still want to report this failure with the rest of the upload
    // results, so we extract what the upload failure report should be from the options passed to this fn
    if (!uploadResults.find((result: ArtifactUploadResult) => {
      return result.key === ArtifactKinds.PROTOCOL
    }) && postUploadProtocolFatalError) {
      debug('composing error report from options')
      uploadResults.push(await composeProtocolErrorReportFromOptions(options))
    }

    uploadReport = uploadResults.reduce(toUploadReportPayload, { video: undefined, screenshots: [], protocol: undefined })
  } catch (err) {
    debug('primary try/catch failure, ', err.stack)
    errors.warning('CLOUD_CANNOT_UPLOAD_ARTIFACTS', err)

    await exception.create(err)
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

    // eslint-disable-next-line no-console
    console.log('')
    errors.warning('CLOUD_CANNOT_CONFIRM_ARTIFACTS', err)

    if (err.statusCode !== 503) {
      return exception.create(err)
    }
  }
}
