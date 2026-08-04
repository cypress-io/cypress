export const AUT_FRAME_NAME_IDENTIFIER = 'Your project:'

// window.name of the runner's own iframes. The automation layer looks for the AUT among top's
// child frames, so every frame the runner owns other than the AUT has to be identifiable.
export const REPORTER_FRAME_NAME = 'Cypress Reporter'

export const AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER = 'AUT Snapshot'

export const SPEC_FRAME_NAME_IDENTIFIER = 'Your Spec'

export const SPEC_BRIDGE_FRAME_NAME_IDENTIFIER = 'Spec Bridge'

const RUNNER_FRAME_NAME_IDENTIFIERS = [
  REPORTER_FRAME_NAME,
  AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER,
  SPEC_FRAME_NAME_IDENTIFIER,
  SPEC_BRIDGE_FRAME_NAME_IDENTIFIER,
]

/**
 * Whether a frame name belongs to one of the runner's own iframes, excluding the AUT. An
 * unnamed frame is not treated as the runner's — the AUT is the one frame whose name is out
 * of our control, so it can show up unnamed.
 */
export const isRunnerFrameName = (name?: string) => {
  return !!name && RUNNER_FRAME_NAME_IDENTIFIERS.some((identifier) => name.startsWith(identifier))
}
