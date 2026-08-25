// In dev mode the CLI spawns `node scripts/start.js`, which loads @packages/server.
// The package main auto-starts Cypress on require (see packages/server/index.ts).
require('@packages/server')
