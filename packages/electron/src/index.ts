// Re-export the main electron functionality
export * from './electron'

export { open } from './open'

// Default export for CommonJS compatibility
import * as electron from './electron'

export default electron
