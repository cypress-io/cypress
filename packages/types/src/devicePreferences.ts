export interface DevicePreferences {
  watchForSpecChange?: boolean
  useDarkSidebar?: boolean
  autoScrollingEnabled?: boolean
  preferredEditorBinary?: string | undefined
}

export const devicePreferenceDefaults: DevicePreferences = {
  watchForSpecChange: true,
  useDarkSidebar: true,
  autoScrollingEnabled: true,
  preferredEditorBinary: undefined,
}
