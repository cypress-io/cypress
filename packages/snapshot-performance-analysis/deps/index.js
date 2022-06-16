const slowExecution = process.env.SLOW_EXECUTION != null
const healthy = process.env.HEALTHY != null
const deferred = process.env.DEFERRED != null

let deferredDep

if (deferred) {
  deferredDep = require('./deferred')
}

let healthyDep

if (healthy) {
  healthyDep = require('./healthy')
}

let slowExecutionDep

if (slowExecution) {
  slowExecutionDep = require('./TestFile')
}

module.exports = {
  deferredDep,
  healthyDep,
  slowExecutionDep,
}
