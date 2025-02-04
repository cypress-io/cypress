import type { CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import type { useI18n } from '@cy/i18n'
import { DEBUG_TAB_MEDIUM } from './constants'

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY' | 'REPLAY'

export type DebugArtifact = { icon: ArtifactType, text: string, url: string }

const formatUrl = (url: string, campaign: string): string => {
  return getUrlWithParams({ url, params: { utm_medium: DEBUG_TAB_MEDIUM, utm_campaign: campaign } })
}

export const getDebugArtifacts = (instance: CloudRunInstance | null, t: ReturnType<typeof useI18n>['t']): DebugArtifact[] => {
  const debugArtifacts: DebugArtifact[] = []

  if (instance?.hasReplay && instance.replayUrl) {
    debugArtifacts.push({ icon: 'REPLAY', text: t('debugPage.artifacts.replay'), url: formatUrl(instance.replayUrl, 'Test Replay') })
  }

  if (instance?.hasStdout && instance.stdoutUrl) {
    debugArtifacts.push({ icon: 'TERMINAL_LOG', text: t('debugPage.artifacts.stdout'), url: formatUrl(instance.stdoutUrl, 'Output') })
  }

  if (instance?.hasScreenshots && instance.screenshotsUrl) {
    debugArtifacts.push({ icon: 'IMAGE_SCREENSHOT', text: t('debugPage.artifacts.screenshots'), url: formatUrl(instance.screenshotsUrl, 'Screenshots') })
  }

  if (instance?.hasVideo && instance.videoUrl) {
    debugArtifacts.push({ icon: 'PLAY', text: t('debugPage.artifacts.video'), url: formatUrl(instance.videoUrl, 'Video') })
  }

  return debugArtifacts
}
