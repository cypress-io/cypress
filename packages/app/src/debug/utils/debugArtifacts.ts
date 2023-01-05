import type { CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY'

export type DebugArtifact = { icon: ArtifactType, text: string, url: string }

export const getDebugArtifacts = (instance: CloudRunInstance | null): DebugArtifact[] => {
  const debugArtifacts: DebugArtifact[] = []

  if (instance?.hasStdout && instance.stdoutUrl) {
    debugArtifacts.push({ icon: 'TERMINAL_LOG', text: 'View Log', url: instance.stdoutUrl })
  }

  if (instance?.hasScreenshots && instance.screenshotsUrl) {
    debugArtifacts.push({ icon: 'IMAGE_SCREENSHOT', text: 'View Screenshot', url: instance.screenshotsUrl })
  }

  if (instance?.hasVideo && instance.videoUrl) {
    debugArtifacts.push({ icon: 'PLAY', text: 'View Video', url: instance.videoUrl })
  }

  return debugArtifacts
}
