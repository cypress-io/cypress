// Re-export the main electron functionality
export * from '../lib/electron'

// Default export for CommonJS compatibility
import * as electron from '../lib/electron'

export default electron
