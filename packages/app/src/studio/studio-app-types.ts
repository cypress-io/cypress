import type React from 'react'

export interface StudioPanelProps {
  canAccessStudioLLM: boolean
}

export interface StudioPanelShape {
  (): React.FC<StudioPanelProps>
}

export interface StudioAppDefaultShape {
  StudioPanel: StudioPanelShape
}
