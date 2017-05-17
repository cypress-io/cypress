// register TypeScript Node require hook
// https://github.com/TypeStrong/ts-node#programmatic-usage
const project = require('path').join(__dirname, 'tsconfig.json')
require('ts-node').register({
  project
})

// do we need to prevent any other TypeScript hooks?
// like ../coffee/register.js does?
