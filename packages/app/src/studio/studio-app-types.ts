export interface StudioPanelProps {
  canAccessStudioLLM: boolean
}

export interface StudioAppDefaultShape {
  StudioPanel: (props: StudioPanelProps) => JSX.Element
}
