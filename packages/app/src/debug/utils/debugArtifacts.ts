import type { CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'
import type { useI18n } from '@cy/i18n'

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY'

export type DebugArtifact = { icon: ArtifactType, text: string, url: string }

export const getDebugArtifacts = (instance: CloudRunInstance | null, t: ReturnType<typeof useI18n>['t']): DebugArtifact[] => {
  const debugArtifacts: DebugArtifact[] = []

  if (instance?.hasStdout && instance.stdoutUrl) {
    debugArtifacts.push({ icon: 'TERMINAL_LOG', text: t('debugPage.artifacts.stdout'), url: instance.stdoutUrl })
  }

  if (instance?.hasScreenshots && instance.screenshotsUrl) {
    debugArtifacts.push({ icon: 'IMAGE_SCREENSHOT', text: t('debugPage.artifacts.screenshots'), url: instance.screenshotsUrl })
  }

  if (instance?.hasVideo && instance.videoUrl) {
    debugArtifacts.push({ icon: 'PLAY', text: t('debugPage.artifacts.video'), url: instance.videoUrl })
  }

  return debugArtifacts
}
