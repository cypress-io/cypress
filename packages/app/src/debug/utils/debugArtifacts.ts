import type { CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import type { useI18n } from '@cy/i18n'

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY'

export type DebugArtifact = { icon: ArtifactType, text: string, url: string }

const formatUrl = (url: string, campaign: string): string => {
  return getUrlWithParams({ url, params: { utm_medium: 'Debug Tag', utm_campaign: campaign } })
}

export const getDebugArtifacts = (instance: CloudRunInstance | null, t: ReturnType<typeof useI18n>['t']): DebugArtifact[] => {
  const debugArtifacts: DebugArtifact[] = []

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
