const { manipulateCache } = require('./uncached-manipulator')

const res = manipulateCache()

console.log(JSON.stringify(res))
