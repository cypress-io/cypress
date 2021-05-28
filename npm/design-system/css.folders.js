const path = require('path')

// Resolve css dir and both local and monorepo node_modules
module.exports = ['src/css', 'node_modules', '../../node_modules'].map((p) => path.resolve(p))
