// Snapshot script execution is synchronous; start-cypress.run() is async and will not
// finish during mksnapshot. Require platform installer modules here so their exports
// (including resolved binary paths) are embedded in the snapshot. Without this,
// deferred @ffprobe-installer/ffprobe re-executes at runtime and fails to resolve
// @ffprobe-installer/<platform>-<arch> after binary-cleanup removes it from disk.
require('@ffmpeg-installer/ffmpeg')
require('@ffprobe-installer/ffprobe')

require('./start-cypress.js').run()
