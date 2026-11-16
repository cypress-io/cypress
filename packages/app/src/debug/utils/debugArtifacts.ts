import type { CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { DEBUG_TAB_MEDIUM } from './constants'

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY' | 'REPLAY'

export type DebugArtifact = { icon: ArtifactType, text: string, url: string }

const formatUrl = (url: string, campaign: string): string => {
  return getUrlWithParams({ url, params: { utm_medium: DEBUG_TAB_MEDIUM, utm_campaign: campaign } })
}

export const getDebugArtifacts = (instance: CloudRunInstance | null): DebugArtifact[] => {
  const debugArtifacts: DebugArtifact[] = []

  if (instance?.hasReplay && instance.replayUrl) {
    debugArtifacts.push({ icon: 'REPLAY', text: 'View Test Replay', url: formatUrl(instance.replayUrl, 'Test Replay') })
  }

  if (instance?.hasStdout && instance.stdoutUrl) {
    debugArtifacts.push({ icon: 'TERMINAL_LOG', text: 'View Log', url: formatUrl(instance.stdoutUrl, 'Output') })
  }

  if (instance?.hasScreenshots && instance.screenshotsUrl) {
    debugArtifacts.push({ icon: 'IMAGE_SCREENSHOT', text: 'View Screenshots', url: formatUrl(instance.screenshotsUrl, 'Screenshots') })
  }

  if (instance?.hasVideo && instance.videoUrl) {
    debugArtifacts.push({ icon: 'PLAY', text: 'View Video', url: formatUrl(instance.videoUrl, 'Video') })
  }

  return debugArtifacts
}
