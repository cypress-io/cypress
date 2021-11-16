import {
  Editor,
  linuxEditors,
  macOSEditors,
  windowsEditors,
} from '@packages/types'

export const getEnvEditors = (): readonly Editor[] => {
  switch (process.platform) {
    case 'darwin':
      return macOSEditors
    case 'win32':
      return windowsEditors
    default:
      return linuxEditors
  }
}
