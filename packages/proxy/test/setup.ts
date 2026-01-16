// Setup TypeScript require hook for compiled CommonJS output
// This allows require() calls in the compiled cjs/ files to resolve TypeScript files
const registerDir = require('@packages/ts/registerDir')

// Register TypeScript require hook for the entire workspace
registerDir(undefined)
