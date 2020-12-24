#!/usr/bin/env node

const { execSync } = require('child_process')

const namespace = '__cypress-ct123'
const clientRoute = '/__ct/'
const socketIoRoute = '/__ct-socket.io'
const port = 4444

const envVars = `
E2E_OVER_COMPONENT_TESTS=true
CYPRESS_NAMESPACE=${namespace}
CYPRESS_CLIENT_ROUTE=${clientRoute}
CYPRESS_PORT=${port}
CYPRESS_SOCKET_IO_ROUTE=${socketIoRoute}
`.split('\n').join(' ')

const flags = [`--component-testing`, `--run-project`, process.argv.slice(2)].join(' ')

execSync(`yarn cross-env ${envVars} node ../../scripts/start.js open ${flags}`, { stdio: 'inherit' })
