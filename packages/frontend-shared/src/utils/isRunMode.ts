import { CY_IN_CY_SIMULATE_RUN_MODE } from '@packages/types'

export const isRunMode = window.location.href.includes(CY_IN_CY_SIMULATE_RUN_MODE) || (window.__CYPRESS_MODE__ === 'run' && window.top === window)
