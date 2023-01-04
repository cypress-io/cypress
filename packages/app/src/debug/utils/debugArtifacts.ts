import type { ArtifactType, TestResults } from '../types'

export const getDebugArtifacts = (instance: TestResults['instance']) => {
  const debugArtifacts: { icon: ArtifactType, text: string, url: string }[] = []

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
