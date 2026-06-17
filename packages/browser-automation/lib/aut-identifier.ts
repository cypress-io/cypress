export const AUT_FRAME_NAME_IDENTIFIER = 'Your project:'

/** True when a frame name belongs to the AUT frame. */
export const isAutFrameName = (name: string | undefined): boolean => {
  return !!name && name.startsWith(AUT_FRAME_NAME_IDENTIFIER)
}
