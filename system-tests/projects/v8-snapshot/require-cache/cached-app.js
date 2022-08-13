const { manipulateCache } = require('./cached-manipulator')

const res = manipulateCache()

console.log(JSON.stringify(res))
