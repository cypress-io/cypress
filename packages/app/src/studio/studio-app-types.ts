export interface StudioPanelShape {
  (): JSX.Element
}

export interface StudioAppDefaultShape {
  StudioPanel: StudioPanelShape
}
