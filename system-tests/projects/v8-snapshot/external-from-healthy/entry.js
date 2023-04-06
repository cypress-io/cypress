const healthy = require('./healthy')

// This entry invokes a function on healthy which would require an external module to be resolved.
// Therefore while healthy can be included in the snapshot, this entry module cannot.
module.exports = healthy
