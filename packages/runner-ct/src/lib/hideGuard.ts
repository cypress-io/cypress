import State from './state'

export const hideIfScreenshotting = (state: State, callback: () => number) => {
  if (state.screenshotting) {
    return 0
  }

  return callback()
}

export const hideReporterIfNecessary = (state: State, callback: () => number) => {
  if (state.screenshotting || !state.spec) {
    return 0
  }

  return callback()
}

export const hideSpecsListIfNecessary = (state: State) => {
  return state.screenshotting || !state.isSpecsListOpen
}
