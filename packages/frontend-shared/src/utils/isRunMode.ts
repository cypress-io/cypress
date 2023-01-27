export const isRunMode = () => {
  const mode = window.__CYPRESS_SIMULATE_RUN_MODE_FOR_CY_IN_CY_TEST__ || (window.__CYPRESS_MODE__ === 'run' && window.top === window)

  return mode
}
