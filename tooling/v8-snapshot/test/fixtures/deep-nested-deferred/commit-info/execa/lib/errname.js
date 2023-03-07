// Reproduces code that causes this module to be deferred

const util = require('util')

// Added in: v9.7.0 so for our test case this we don't need to consider the else branch
if (typeof util.getSystemErrorName === 'function') {
  module.exports = util.getSystemErrorName
} else {
  module.exports = () => 'Used to be uv.errname'
}
