const srv = require('../../.bundle/server')

const i = process.hrtime.bigint()

srv.server.cypressServer()

console.log(process.hrtime.bigint() - i)
