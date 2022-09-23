const healthy = require('./healthy')

// This entry invokes a function on healthy which would require a deferred module to be resolved.
// Therefore while healthy can be included in the snapshot, this entry module cannot.
console.log(JSON.stringify({ healthyCodeLen: healthy().length }))
