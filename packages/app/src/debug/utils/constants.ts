type ValueOf<T> = T[keyof T]

export const DEBUG_SLIDESHOW = {
  id: 'iatr_debug_slideshow',
  campaigns: {
    login: 'Debug Login Empty State',
    connectProject: 'Debug Connect Project Empty State',
    recordRun: 'Debug Record Run Empty State',
  },
  medium: 'Debug Tab',
} as const

export type DebugSlideshowCampaigns = ValueOf<typeof DEBUG_SLIDESHOW['campaigns']>
