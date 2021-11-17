export interface DevicePreferences {
  watchForSpecChange?: boolean
  useDarkSidebar?: boolean
  autoScrollingEnabled?: boolean
  // preferredEditorBinary?: string 
}

export const devicePreferenceDefaults: DevicePreferences = {
  watchForSpecChange: true,
  useDarkSidebar: true,
  autoScrollingEnabled: true,
}
