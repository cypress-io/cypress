process.env.CYPRESS_INTERNAL_ENV = 'development'
process.env.GRAPHQL_CODEGEN = 'true'
process.env.GRAPHQL_CODEGEN_EXIT = 'true'
// TODO: we should be upgrading ts-node or moving to Thorsten's work soon
// and then this can be removed
process.env.TS_NODE_CACHE = 'false'
require('@packages/ts/register')
require('../src/schema')
