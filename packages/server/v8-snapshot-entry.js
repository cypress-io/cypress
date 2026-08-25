// Snapshot script execution is synchronous; start-cypress.run() is async and will not
// finish during mksnapshot. Warm ffmpeg exports for deferred video_capture loading.
require('@ffmpeg-installer/ffmpeg')

require('./start-cypress.js').run()
