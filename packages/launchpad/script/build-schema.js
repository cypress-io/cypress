process.env.CYPRESS_INTERNAL_ENV = 'development'
process.env.GRAPHQL_CODEGEN = 'true'
process.env.GRAPHQL_CODEGEN_EXIT = 'true'
require('@packages/ts/register')
require('../../server/lib/graphql/schema')
